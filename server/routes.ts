import { Router, Request, Response, NextFunction } from 'express';
import { ContestStore, DEFAULT_CONTEST_ID } from './contestStore';
import { Judge0Client } from './judge0';
import { SubmissionQueue } from './queue';
import { RateLimiter } from './rateLimiter';
import { computeLeaderboard, updateParticipantScore } from './scoring';
import { run50ParticipantLoadTest } from './loadTester';
import { REFERENCE_SOLUTIONS } from './referenceSolutions';
import {
  Submission,
  IntegrityEvent,
  Participant,
  ContestSettings,
  ContestStatus,
  Problem,
  SystemHealth,
  Verdict,
} from '../src/types';

export const apiRouter = Router();

const store = ContestStore.getInstance();
const queue = SubmissionQueue.getInstance();
const judge0 = new Judge0Client();

// Server start time for uptime tracking
const SERVER_START_TIME = Date.now();

// Lightweight, unauthenticated, non-blocking health checks (Vercel & monitoring compatible)
apiRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'contest-platform',
  });
});

apiRouter.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'contest-platform',
  });
});

// Request logging middleware with Request ID
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const t0 = Date.now();
  (req as any).reqId = reqId;

  res.on('finish', () => {
    const duration = Date.now() - t0;
    // Structured log (avoid logging passwords, tokens, full source code)
    console.log(
      JSON.stringify({
        requestId: reqId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip || req.socket.remoteAddress,
        userId: (req as any).user?.uid || 'anonymous',
      })
    );
  });
  next();
});

// Authentication extraction middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Default guest/anonymous context
    (req as any).user = null;
    return next();
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Handle dev/demo tokens
  if (token.startsWith('dev-token-')) {
    const parts = token.replace('dev-token-', '').split('-');
    const role = parts[0] === 'admin' ? 'ADMIN' : 'PARTICIPANT';
    const email = parts[0] === 'admin' ? 'admin@collegiate-contest.edu' : `participant_${parts[1] || '1'}@college.edu`;
    const uid = `uid-${parts[0]}-${parts[1] || '1'}`;
    const name = parts[0] === 'admin' ? 'Contest Admin' : `Participant #${parts[1] || '1'}`;

    (req as any).user = {
      uid,
      email,
      displayName: name,
      role,
    };
    return next();
  }

  // Token decoding
  try {
    // If JWT structure, parse base64 payload safely
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '{}', 'base64').toString('utf-8'));
    (req as any).user = {
      uid: payload.user_id || payload.sub || 'user_1',
      email: payload.email || 'user@college.edu',
      displayName: payload.name || 'Contestant',
      role: payload.email?.includes('admin') ? 'ADMIN' : 'PARTICIPANT',
    };
  } catch {
    (req as any).user = null;
  }
  next();
};

apiRouter.use(authMiddleware);

// Admin-only gate middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
    return;
  }
  next();
};

// ==========================================
// 1. AUTH & SESSION APIS
// ==========================================

apiRouter.post('/auth/dev-login', (req: Request, res: Response) => {
  const { role = 'PARTICIPANT', customName, customEmail } = req.body;
  const userRole = role === 'ADMIN' ? 'ADMIN' : 'PARTICIPANT';
  const idSuffix = Math.floor(1000 + Math.random() * 9000);
  const uid = userRole === 'ADMIN' ? 'admin-root-01' : `user-${idSuffix}`;
  const email = customEmail || (userRole === 'ADMIN' ? 'admin@collegiate-contest.edu' : `participant_${idSuffix}@college.edu`);
  const displayName = customName || (userRole === 'ADMIN' ? 'Lead Contest Administrator' : `Contestant #${idSuffix}`);
  const token = `dev-token-${userRole.toLowerCase()}-${idSuffix}`;

  res.json({
    token,
    user: {
      uid,
      email,
      displayName,
      role: userRole,
    },
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user });
});

// ==========================================
// 2. CONTEST APIS
// ==========================================

apiRouter.get('/contests/:contestId', (req: Request, res: Response) => {
  const contest = store.contest;
  const now = new Date().toISOString();

  // Return contest information with server-authoritative time
  res.json({
    contest,
    serverTime: now,
    isActive: contest.status === 'RUNNING' && now >= contest.startTime && now <= contest.endTime,
    timeRemainingSec: Math.max(0, Math.floor((new Date(contest.endTime).getTime() - Date.now()) / 1000)),
  });
});

// Participant enters/starts contest
apiRouter.post('/contests/:contestId/start', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { accessCode, agreedToRules } = req.body;

  if (!user) {
    res.status(401).json({ error: 'Authentication required to start contest' });
    return;
  }

  if (!agreedToRules) {
    res.status(400).json({ error: 'You must review and agree to the contest integrity rules' });
    return;
  }

  const contest = store.contest;
  if (contest.accessCode && accessCode !== contest.accessCode && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Invalid contest access code' });
    return;
  }

  // Retrieve or create participant profile
  let participant = store.getParticipantByUserId(user.uid);
  const now = new Date().toISOString();

  if (!participant) {
    const pId = `participant-${user.uid}`;
    participant = {
      id: pId,
      userId: user.uid,
      contestId: contest.id,
      name: user.displayName || 'Anonymous Participant',
      email: user.email,
      joinedAt: now,
      startedAt: now,
      lastActiveAt: now,
      totalScore: 0,
      solvedCount: 0,
      penaltyTimeMinutes: 0,
      lastScoreUpdate: now,
      status: 'ACTIVE',
      riskLevel: 'LOW',
      violationCount: 0,
      problemScores: {},
    };
    store.saveParticipant(participant);
  } else if (!participant.startedAt) {
    participant.startedAt = now;
    participant.status = 'ACTIVE';
    store.saveParticipant(participant);
  }

  res.json({
    success: true,
    participant,
    serverTime: now,
    contestStartTime: contest.startTime,
    contestEndTime: contest.endTime,
  });
});

// Fetch problem set (Hidden test cases stripped for participant security)
apiRouter.get('/contests/:contestId/problems', (req: Request, res: Response) => {
  const problems = store.getSanitizedProblems();
  res.json({ problems });
});

// Get individual problem details
apiRouter.get('/problems/:problemId', (req: Request, res: Response) => {
  const problem = store.getProblemById(req.params.problemId);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  // Never return hiddenTestCases in public endpoint
  const { hiddenTestCases, ...sanitized } = problem;
  res.json({
    problem: {
      ...sanitized,
      hiddenTestCasesCount: hiddenTestCases ? hiddenTestCases.length : 0,
    },
  });
});

// Live Leaderboard (Cached and aggregate-updated)
apiRouter.get('/contests/:contestId/leaderboard', (req: Request, res: Response) => {
  const leaderboard = computeLeaderboard(req.params.contestId || DEFAULT_CONTEST_ID);
  res.json({
    contestId: req.params.contestId,
    totalParticipants: leaderboard.length,
    leaderboard,
    updatedAt: new Date().toISOString(),
  });
});

// ==========================================
// 3. CODE EXECUTION & SUBMISSIONS (Asynchronous Serverless Flow)
// ==========================================

// RUN code (Sample public tests only, rate-limited)
apiRouter.post('/problems/:problemId/run', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { language, code, participantId, customInput } = req.body;
  const problemId = req.params.problemId;

  if (!language || !code) {
    res.status(400).json({ error: 'Language and source code are required.' });
    return;
  }

  const pId = participantId || (user ? `participant-${user.uid}` : 'guest_participant');

  // Check rate limit for RUN requests (3/min, 10/10min)
  const rateCheck = RateLimiter.checkRunLimit(pId);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: rateCheck.message,
      retryAfterSeconds: rateCheck.retryAfterSec,
    });
    return;
  }

  const problem = store.getProblemById(problemId);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  const submissionId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const testCasesToRun = customInput
    ? [{ input: customInput, expectedOutput: '', isHidden: false }]
    : problem.publicTestCases.map((tc) => ({ ...tc, isHidden: false }));

  // Asynchronously dispatch batch execution to Judge0 without blocking
  const judge0Tokens = await judge0.createBatchSubmission(
    language,
    code,
    testCasesToRun,
    problem.cpuLimitSeconds,
    problem.memoryLimitMb
  );

  const submission: Submission = {
    id: submissionId,
    idempotencyKey: `run_${pId}_${Date.now()}`,
    participantId: pId,
    participantName: user?.displayName || 'Contestant',
    participantEmail: user?.email || 'guest@contest.edu',
    contestId: problem.contestId,
    problemId: problem.id,
    problemTitle: problem.title,
    language,
    code,
    type: 'RUN',
    status: 'QUEUED',
    score: 0,
    maxScore: 0,
    passedTests: 0,
    totalTests: testCasesToRun.length,
    testResults: [],
    judge0Tokens,
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  store.saveSubmission(submission);

  res.status(202).json({
    message: 'Code run queued — evaluating against sample test cases...',
    submissionId: submission.id,
    status: 'QUEUED',
  });
});

// SUBMIT code (Official evaluation against hidden test cases with scoring)
apiRouter.post('/problems/:problemId/submit', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { language, code, participantId, idempotencyKey } = req.body;
  const problemId = req.params.problemId;

  // 1. Validate authentication
  if (!user) {
    res.status(401).json({ error: 'Authentication required to submit solution.' });
    return;
  }

  // 2. Validate language and source code
  if (!language || !code) {
    res.status(400).json({ error: 'Language and source code are required.' });
    return;
  }

  const pId = participantId || `participant-${user.uid}`;

  // 3. Validate contest is still active (Server-authoritative timer check)
  const contest = store.contest;
  const now = Date.now();
  const contestStart = new Date(contest.startTime).getTime();
  const contestEnd = new Date(contest.endTime).getTime();

  if (now < contestStart) {
    res.status(400).json({ error: 'The contest has not started yet.' });
    return;
  }

  if (now > contestEnd + 30000) {
    // 30s clock-skew tolerance
    res.status(400).json({ error: 'The contest has ended. Submissions are closed.' });
    return;
  }

  // 4. Validate problem exists
  const problem = store.getProblemById(problemId);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }

  // 5. Idempotency check to avoid double submission on network reconnect
  if (idempotencyKey) {
    const existing = store.getSubmissionByIdempotencyKey(idempotencyKey);
    if (existing) {
      res.json({
        message: 'Submission already received.',
        submissionId: existing.id,
        status: existing.status,
      });
      return;
    }
  }

  // 6. Rate & Attempt Limits check
  const limitCheck = RateLimiter.checkSubmitLimit(pId, problemId);
  if (!limitCheck.allowed) {
    res.status(429).json({ error: limitCheck.message });
    return;
  }

  // 7. Generate unique submission ID/idempotency key
  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const key = idempotencyKey || `idem_${submissionId}`;

  const allTestCases = [
    ...problem.publicTestCases.map((tc) => ({ ...tc, isHidden: false })),
    ...(problem.hiddenTestCases || []).map((tc) => ({ ...tc, isHidden: true })),
  ];

  // 8. Send code to Judge0 asynchronously (returns token batch immediately)
  const judge0Tokens = await judge0.createBatchSubmission(
    language,
    code,
    allTestCases,
    problem.cpuLimitSeconds,
    problem.memoryLimitMb
  );

  // 9. Store submission with status QUEUED and Judge0 tokens
  const submission: Submission = {
    id: submissionId,
    idempotencyKey: key,
    participantId: pId,
    participantName: user?.displayName || 'Contestant',
    participantEmail: user?.email || 'contestant@college.edu',
    contestId: problem.contestId,
    problemId: problem.id,
    problemTitle: problem.title,
    language,
    code,
    type: 'SUBMIT',
    status: 'QUEUED',
    score: 0,
    maxScore: problem.points,
    passedTests: 0,
    totalTests: allTestCases.length,
    testResults: [],
    judge0Tokens,
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };

  store.saveSubmission(submission);

  // 10. Return immediately to browser
  res.status(202).json({
    message: 'Submission received — evaluating...',
    submissionId: submission.id,
    status: 'QUEUED',
    idempotencyKey: key,
  });
});

// Check status of a submission (Evaluates Judge0 tokens on-demand with atomic state transition)
apiRouter.get('/submissions/:submissionId', async (req: Request, res: Response) => {
  const sub = store.getSubmission(req.params.submissionId);
  if (!sub) {
    res.status(404).json({ error: 'Submission not found' });
    return;
  }

  // 1. If submission is already in a terminal state, return stored sanitized result immediately (NO Judge0 calls, NO recalculation)
  if (sub.status === 'COMPLETED' || sub.status === 'FAILED' || sub.status === 'TIMEOUT') {
    const sanitizedTestResults = (sub.testResults || []).map((tr) => {
      if (tr.isHidden) {
        return {
          testIndex: tr.testIndex,
          isHidden: true,
          passed: tr.passed,
          verdict: tr.verdict,
          executionTimeSec: tr.executionTimeSec,
          memoryKb: tr.memoryKb,
          compileOutput: tr.compileOutput,
        };
      }
      return tr;
    });

    res.json({
      submission: {
        ...sub,
        testResults: sanitizedTestResults,
      },
    });
    return;
  }

  // 2. If another concurrent request is currently evaluating this exact submission, return in-progress status
  if (sub.status === 'PROCESSING_RESULT') {
    res.json({
      submission: {
        ...sub,
        status: 'PROCESSING',
        testResults: [],
      },
    });
    return;
  }

  // 3. Atomically lock state to PROCESSING_RESULT to prevent duplicate simultaneous evaluation
  sub.status = 'PROCESSING_RESULT';
  store.saveSubmission(sub);

  const problem = store.getProblemById(sub.problemId);
  if (problem) {
    const isRun = sub.type === 'RUN';
    const testCases = isRun
      ? problem.publicTestCases.map((tc) => ({ ...tc, isHidden: false }))
      : [
          ...problem.publicTestCases.map((tc) => ({ ...tc, isHidden: false })),
          ...(problem.hiddenTestCases || []).map((tc) => ({ ...tc, isHidden: true })),
        ];

    try {
      const checkResult = await judge0.checkBatchSubmission(
        sub.judge0Tokens || [],
        testCases,
        sub.language,
        sub.code,
        problem.cpuLimitSeconds
      );

      if (checkResult.completed && checkResult.results) {
        const results = checkResult.results;
        let passedCount = 0;
        let overallVerdict: Verdict = 'ACCEPTED';

        for (const tr of results) {
          if (tr.passed) {
            passedCount++;
          } else if (overallVerdict === 'ACCEPTED') {
            overallVerdict = tr.verdict;
          }
        }

        const totalTests = testCases.length;
        const scoreRatio = totalTests > 0 ? passedCount / totalTests : 0;
        const finalScore = isRun ? 0 : Math.round(problem.points * scoreRatio);

        sub.status = 'COMPLETED';
        sub.overallVerdict = overallVerdict;
        sub.passedTests = passedCount;
        sub.totalTests = totalTests;
        sub.score = finalScore;
        sub.maxScore = isRun ? 0 : problem.points;
        sub.testResults = results;
        sub.completedAt = new Date().toISOString();
        sub.processedAt = new Date().toISOString();

        // Ensure score is applied exactly once
        if (!sub.scoreApplied) {
          sub.scoreApplied = true;
          if (!isRun) {
            updateParticipantScore(
              sub.participantId,
              sub.problemId,
              finalScore,
              passedCount === totalTests,
              sub.id
            );
          }
        }

        store.saveSubmission(sub);
      } else {
        sub.status = 'PROCESSING';
        store.saveSubmission(sub);
      }
    } catch (err: any) {
      console.error(`[SubmissionEvaluation] Check error for ${sub.id}:`, err.message);
      sub.status = 'PROCESSING'; // Allow retry on transient error
      store.saveSubmission(sub);
    }
  } else {
    sub.status = 'FAILED';
    sub.error = 'Problem definition not found';
    store.saveSubmission(sub);
  }

  // Public/participant response (Hide hidden test case inputs and expected outputs)
  const sanitizedTestResults = (sub.testResults || []).map((tr) => {
    if (tr.isHidden) {
      return {
        testIndex: tr.testIndex,
        isHidden: true,
        passed: tr.passed,
        verdict: tr.verdict,
        executionTimeSec: tr.executionTimeSec,
        memoryKb: tr.memoryKb,
        compileOutput: tr.compileOutput,
      };
    }
    return tr;
  });

  res.json({
    submission: {
      ...sub,
      testResults: sanitizedTestResults,
    },
  });
});

// Get participant's submission history
apiRouter.get('/submissions/participant/:participantId', (req: Request, res: Response) => {
  const pId = req.params.participantId;
  const user = (req as any).user;

  // Authorization: Participant can only view their own submissions
  if (user && user.role !== 'ADMIN' && `participant-${user.uid}` !== pId && user.uid !== pId) {
    res.status(403).json({ error: 'Access denied to other participant submissions.' });
    return;
  }

  const userSubs = Array.from(store.submissions.values())
    .filter((s) => s.participantId === pId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ submissions: userSubs });
});

// Draft Autosave APIs (Debounced client-to-server save)
apiRouter.get('/drafts/:problemId', (req: Request, res: Response) => {
  const user = (req as any).user;
  const pId = (req.query.participantId as string) || (user ? `participant-${user.uid}` : 'guest_participant');
  const draft = store.getDraft(pId, req.params.problemId);
  res.json({ draft: draft || null });
});

apiRouter.post('/drafts/:problemId', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { language, code, participantId } = req.body;
  const pId = participantId || (user ? `participant-${user.uid}` : 'guest_participant');

  store.saveDraft(pId, req.params.problemId, {
    problemId: req.params.problemId,
    language,
    code,
    updatedAt: new Date().toISOString(),
  });

  res.json({ success: true, savedAt: new Date().toISOString() });
});

// ==========================================
// 4. INTEGRITY & ANTI-CHEATING MONITORING
// ==========================================

apiRouter.post('/integrity-events', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { eventType, durationMs, sessionId, details, participantId } = req.body;
  const pId = participantId || (user ? `participant-${user.uid}` : 'guest_participant');

  if (!eventType) {
    res.status(400).json({ error: 'eventType is required' });
    return;
  }

  // Throttle excessive client telemetry writes
  if (!RateLimiter.checkIntegrityBatchLimit(pId)) {
    res.status(200).json({ received: true, throttled: true });
    return;
  }

  const participant = store.getParticipant(pId);
  const eventId = `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
  if (['FULLSCREEN_EXIT', 'VISIBILITY_CHANGE', 'WINDOW_BLUR'].includes(eventType)) {
    severity = 'WARNING';
  }

  const event: IntegrityEvent = {
    id: eventId,
    participantId: pId,
    participantName: participant?.name || user?.displayName || 'Contestant',
    contestId: store.contest.id,
    eventType,
    timestamp: new Date().toISOString(),
    durationMs,
    sessionId: sessionId || 'session_default',
    details,
    severity,
  };

  store.addIntegrityEvent(event);

  // Update participant violation count & risk tier
  if (participant && severity === 'WARNING') {
    participant.violationCount = (participant.violationCount || 0) + 1;
    if (participant.violationCount >= 3) {
      participant.riskLevel = 'HIGH';
    } else if (participant.violationCount >= 1) {
      participant.riskLevel = 'MEDIUM';
    }
    store.saveParticipant(participant);
  }

  res.json({
    success: true,
    eventId,
    violationCount: participant?.violationCount || 0,
    riskLevel: participant?.riskLevel || 'LOW',
  });
});

// ==========================================
// 5. ADMIN CONTROL & MONITORING APIS
// ==========================================

apiRouter.get('/admin/overview', requireAdmin, (req: Request, res: Response) => {
  const participants = Array.from(store.participants.values());
  const submissions = Array.from(store.submissions.values());
  const queueStats = queue.getStats();

  const totalParticipants = participants.length;
  const activeParticipants = participants.filter((p) => p.status === 'ACTIVE').length;
  const highRiskCount = participants.filter((p) => p.riskLevel === 'HIGH').length;

  const totalSubmissions = submissions.filter((s) => s.type === 'SUBMIT').length;
  const acceptedSubmissions = submissions.filter((s) => s.overallVerdict === 'ACCEPTED').length;

  res.json({
    contest: store.contest,
    stats: {
      totalParticipants,
      activeParticipants,
      highRiskCount,
      totalSubmissions,
      acceptedSubmissions,
      queueStats,
    },
    systemHealth: getSystemHealthSnapshot(),
  });
});

apiRouter.get('/admin/participants', requireAdmin, (req: Request, res: Response) => {
  const participants = Array.from(store.participants.values()).sort(
    (a, b) => b.totalScore - a.totalScore
  );
  res.json({ participants });
});

apiRouter.get('/admin/submissions', requireAdmin, (req: Request, res: Response) => {
  const subs = Array.from(store.submissions.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ submissions: subs });
});

apiRouter.get('/admin/integrity-events', requireAdmin, (req: Request, res: Response) => {
  res.json({ events: store.integrityEvents });
});

apiRouter.post('/admin/contest/status', requireAdmin, (req: Request, res: Response) => {
  const { status, durationMinutes, startTime, endTime } = req.body;
  if (status) store.contest.status = status as ContestStatus;
  if (durationMinutes) store.contest.durationMinutes = durationMinutes;
  if (startTime) store.contest.startTime = startTime;
  if (endTime) store.contest.endTime = endTime;
  store.contest.updatedAt = new Date().toISOString();

  res.json({ success: true, contest: store.contest });
});

apiRouter.post('/admin/contest/settings', requireAdmin, (req: Request, res: Response) => {
  const newSettings = req.body as Partial<ContestSettings>;
  store.contest.settings = {
    ...store.contest.settings,
    ...newSettings,
  };
  store.contest.updatedAt = new Date().toISOString();
  res.json({ success: true, settings: store.contest.settings });
});

apiRouter.get('/admin/problems', requireAdmin, (req: Request, res: Response) => {
  res.json({ problems: store.problems });
});

apiRouter.get('/admin/reference-solutions', requireAdmin, (req: Request, res: Response) => {
  res.json({ solutions: REFERENCE_SOLUTIONS });
});

apiRouter.post('/admin/problems/:id/hidden-tests', requireAdmin, (req: Request, res: Response) => {
  const id = req.params.id;
  const { input, expectedOutput } = req.body;
  const problem = store.problems.find((p) => p.id === id);
  if (!problem) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }
  if (!problem.hiddenTestCases) {
    problem.hiddenTestCases = [];
  }
  problem.hiddenTestCases.push({
    input,
    expectedOutput,
    isHidden: true,
  });
  res.json({ success: true, hiddenTestCasesCount: problem.hiddenTestCases.length });
});

apiRouter.post('/admin/problems', requireAdmin, (req: Request, res: Response) => {
  const newProblem = req.body as Problem;
  newProblem.id = newProblem.id || `prob-${Date.now()}`;
  newProblem.contestId = store.contest.id;
  newProblem.order = store.problems.length + 1;
  store.problems.push(newProblem);
  res.json({ success: true, problem: newProblem });
});

apiRouter.put('/admin/problems/:id', requireAdmin, (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = store.problems.findIndex((p) => p.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Problem not found' });
    return;
  }
  store.problems[idx] = {
    ...store.problems[idx],
    ...req.body,
    id,
  };
  res.json({ success: true, problem: store.problems[idx] });
});

apiRouter.get('/admin/health', requireAdmin, (req: Request, res: Response) => {
  res.json({ health: getSystemHealthSnapshot() });
});

apiRouter.post('/admin/health/ping-judge0', requireAdmin, async (req: Request, res: Response) => {
  const pingRes = await judge0.ping();
  res.json({
    ping: pingRes,
    judge0Config: judge0.getConfig(),
  });
});

apiRouter.post('/admin/test/simulate-load', requireAdmin, async (req: Request, res: Response) => {
  const numParticipants = Math.min(100, Math.max(10, req.body.numParticipants || 50));
  try {
    const result = await run50ParticipantLoadTest(numParticipants);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: `Load test error: ${err.message}` });
  }
});

function getSystemHealthSnapshot(): SystemHealth {
  const judge0Health = judge0.getHealth();
  const queueStats = queue.getStats();
  const activeUsers = Array.from(store.participants.values()).filter((p) => p.status === 'ACTIVE').length;

  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
  if (judge0Health.status === 'OFFLINE' || queueStats.failedCount > 20) {
    overallStatus = 'DEGRADED';
  }

  return {
    status: overallStatus,
    judge0: judge0Health,
    database: {
      status: 'ONLINE',
      latencyMs: 14,
    },
    queue: queueStats,
    activeUsers,
    uptimeSeconds: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
  };
}
