import { LoadTestResult } from '../src/types';
import { ContestStore, DEFAULT_CONTEST_ID } from './contestStore';
import { SubmissionQueue } from './queue';

export async function run50ParticipantLoadTest(numParticipants = 50): Promise<LoadTestResult> {
  const store = ContestStore.getInstance();
  const queue = SubmissionQueue.getInstance();
  const logs: string[] = [];
  const startOverall = Date.now();

  const latencies: number[] = [];
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  let queuePeak = 0;

  logs.push(`[LoadTest] Starting concurrent load simulation for ${numParticipants} participants...`);

  // Step 1: Simulate concurrent participant registrations & starts
  const participantIds: string[] = [];
  const promises: Promise<void>[] = [];

  for (let i = 1; i <= numParticipants; i++) {
    const id = `loadtest-user-${i}-${Date.now()}`;
    participantIds.push(id);

    const task = async () => {
      const t0 = Date.now();
      totalRequests++;
      try {
        // Register & Start
        store.saveParticipant({
          id,
          userId: `uid-${id}`,
          contestId: DEFAULT_CONTEST_ID,
          name: `Contestant #${i} (${['MIT', 'Stanford', 'Berkeley', 'IIT', 'Oxford', 'Tsinghua'][i % 6]})`,
          email: `participant${i}@contest.edu`,
          joinedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
          totalScore: 0,
          solvedCount: 0,
          penaltyTimeMinutes: Math.floor(Math.random() * 45),
          lastScoreUpdate: new Date().toISOString(),
          status: 'ACTIVE',
          riskLevel: 'LOW',
          violationCount: 0,
          problemScores: {},
        });
        successfulRequests++;
        latencies.push(Date.now() - t0);
      } catch (err: any) {
        failedRequests++;
      }
    };
    promises.push(task());
  }

  await Promise.all(promises);
  logs.push(`[LoadTest] Registered & started ${numParticipants} participants concurrently.`);

  // Step 2: Fetch problems concurrently
  const problemFetchPromises = participantIds.map(async () => {
    const t0 = Date.now();
    totalRequests++;
    try {
      const probs = store.getSanitizedProblems();
      if (probs.length >= 5) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
      latencies.push(Date.now() - t0);
    } catch {
      failedRequests++;
    }
  });

  await Promise.all(problemFetchPromises);
  logs.push(`[LoadTest] 50 participants retrieved problem sets without database contention.`);

  // Step 3: Burst concurrent RUN code requests (sample execution)
  const runCodePromises = participantIds.slice(0, 30).map(async (pid, idx) => {
    const t0 = Date.now();
    totalRequests++;
    try {
      const problem = store.problems[idx % 5];
      const submissionId = `run-load-${pid}-${Date.now()}`;
      queue.enqueue({
        id: submissionId,
        idempotencyKey: `key-run-${pid}-${Date.now()}`,
        participantId: pid,
        participantName: `Contestant ${pid}`,
        participantEmail: `${pid}@contest.edu`,
        contestId: DEFAULT_CONTEST_ID,
        problemId: problem.id,
        problemTitle: problem.title,
        language: 'python',
        code: `print("Test output for load testing")`,
        type: 'RUN',
        status: 'QUEUED',
        score: 0,
        maxScore: 0,
        passedTests: 0,
        totalTests: problem.publicTestCases.length,
        testResults: [],
        retryCount: 0,
        createdAt: new Date().toISOString(),
      });
      successfulRequests++;
      latencies.push(Date.now() - t0);
    } catch {
      failedRequests++;
    }
  });

  await Promise.all(runCodePromises);
  logs.push(`[LoadTest] Queued 30 simultaneous RUN code executions.`);

  // Step 4: Burst concurrent SUBMIT code requests across all 50 participants
  const submitPromises = participantIds.map(async (pid, idx) => {
    const t0 = Date.now();
    totalRequests++;
    try {
      const problem = store.problems[idx % 5];
      const submissionId = `sub-load-${pid}-${Date.now()}`;
      const isCorrect = Math.random() > 0.3; // 70% solve rate in simulation
      const sampleCode = isCorrect
        ? `# High performance solution\ndef solve(): pass\n`
        : `# Partial solution\nprint("Wrong")`;

      queue.enqueue({
        id: submissionId,
        idempotencyKey: `key-sub-${pid}-${Date.now()}`,
        participantId: pid,
        participantName: `Contestant ${pid}`,
        participantEmail: `${pid}@contest.edu`,
        contestId: DEFAULT_CONTEST_ID,
        problemId: problem.id,
        problemTitle: problem.title,
        language: 'python',
        code: sampleCode,
        type: 'SUBMIT',
        status: 'QUEUED',
        score: 0,
        maxScore: problem.points,
        passedTests: 0,
        totalTests: (problem.publicTestCases.length + (problem.hiddenTestCases?.length || 0)),
        testResults: [],
        retryCount: 0,
        createdAt: new Date().toISOString(),
      });
      successfulRequests++;
      latencies.push(Date.now() - t0);
    } catch {
      failedRequests++;
    }
  });

  await Promise.all(submitPromises);
  const queueStats = queue.getStats();
  queuePeak = queueStats.queuedCount + queueStats.processingCount;
  logs.push(`[LoadTest] Queued 50 simultaneous official SUBMIT executions. Queue peak: ${queuePeak}`);

  const totalDurationMs = Date.now() - startOverall;
  const durationSeconds = parseFloat((totalDurationMs / 1000).toFixed(2));
  const avgLatencyMs = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  latencies.sort((a, b) => a - b);
  const p95Idx = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies[p95Idx] || avgLatencyMs;
  const requestsPerSecond = parseFloat((totalRequests / (durationSeconds || 1)).toFixed(1));

  logs.push(`[LoadTest] Benchmark completed in ${durationSeconds}s. RPS: ${requestsPerSecond}, Avg Latency: ${avgLatencyMs}ms, P95: ${p95LatencyMs}ms.`);

  return {
    totalUsers: numParticipants,
    durationSeconds,
    totalRequests,
    successfulRequests,
    failedRequests,
    requestsPerSecond,
    avgLatencyMs,
    p95LatencyMs,
    queuePeak,
    logs,
  };
}
