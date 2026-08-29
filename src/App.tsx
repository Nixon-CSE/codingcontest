import { useState, useEffect, useCallback, useTransition } from 'react';
import { Navbar } from './components/Navbar';
import { ProblemView } from './components/ProblemView';
import { CodeEditor } from './components/CodeEditor';
import { TestResultsPanel } from './components/TestResultsPanel';
import { LeaderboardView } from './components/LeaderboardView';
import { SubmissionsHistoryView } from './components/SubmissionsHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { ContestStartModal } from './components/ContestStartModal';
import { IntegrityWarningModal } from './components/IntegrityWarningModal';
import { useContestTimer } from './hooks/useContestTimer';
import { useIntegrityMonitor } from './hooks/useIntegrityMonitor';
import { ApiService } from './api';
import { Contest, Problem, Submission, UserProfile, Participant, RiskLevel } from './types';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState<number>(0);
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [activeView, setActiveView] = useState<'arena' | 'leaderboard' | 'submissions' | 'admin'>('arena');
  const [serverTime, setServerTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingContest, setIsStartingContest] = useState(false);
  const [startModalError, setStartModalError] = useState<string>('');

  // Execution Drawer State
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [execStatusMessage, setExecStatusMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Timer hook
  const { formatted, isUrgent, isExpired } = useContestTimer({
    startTime: contest?.startTime,
    endTime: contest?.endTime,
    serverTime,
    onExpire: () => {
      showToast('The contest has officially ended. Submissions are now closed.', 'info');
    },
  });

  // Integrity hook
  const {
    isFullscreen,
    violationCount,
    riskLevel,
    warningMessage,
    dismissWarning,
    enterFullscreen,
  } = useIntegrityMonitor({
    isActive: Boolean(participant && contest?.status === 'RUNNING' && user?.role === 'PARTICIPANT'),
    participantId: participant?.id,
    copyPasteRestricted: Boolean(contest?.settings.restrictCopyPaste),
    fullscreenRequired: Boolean(contest?.settings.enforceFullscreen),
    onWarning: (msg) => {
      // Handled inside hook & displayed via IntegrityWarningModal
    },
  });

  // Initial bootstrap
  useEffect(() => {
    async function init() {
      try {
        // 1. Log in or restore default participant session
        let currentUser: UserProfile;
        try {
          const me = await ApiService.getCurrentUser();
          currentUser = me.user;
        } catch {
          currentUser = await ApiService.devLogin('PARTICIPANT', 'Alex Rivera (Stanford)');
        }
        setUser(currentUser);

        // 2. Fetch default contest
        const cRes = await ApiService.getContest('collegiate-2026');
        setContest(cRes.contest);
        setServerTime(cRes.serverTime);

        // 3. Fetch problems
        const pRes = await ApiService.getProblems('collegiate-2026');
        setProblems(pRes.problems);
      } catch (err: any) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleStartContest = async (accessCode: string) => {
    if (!contest) return;
    setIsStartingContest(true);
    setStartModalError('');
    try {
      const res = await ApiService.startContest(contest.id, accessCode, true);
      setParticipant(res.participant);
      setServerTime(res.serverTime);
      await enterFullscreen();
      showToast('Contest session started. Good luck!', 'success');
    } catch (err: any) {
      setStartModalError(err.message || 'Failed to start contest.');
    } finally {
      setIsStartingContest(false);
    }
  };

  const handleRunCode = async (language: string, code: string) => {
    const currentProb = problems[activeProblemIndex];
    if (!currentProb) return;

    setIsRunning(true);
    setExecStatusMessage('Dispatching code to sandbox...');
    try {
      const res = await ApiService.runCode(currentProb.id, language, code, participant?.id);
      setExecStatusMessage('Code received in queue — evaluating sample tests...');

      const completedSub = await ApiService.pollSubmission(res.submissionId, (intermediate) => {
        setActiveSubmission(intermediate);
      });

      setActiveSubmission(completedSub);
      if (completedSub.overallVerdict === 'ACCEPTED') {
        showToast('All sample test cases passed!', 'success');
      } else {
        showToast(`Sample Run result: ${completedSub.overallVerdict}`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Run execution failed.', 'error');
    } finally {
      setIsRunning(false);
      setExecStatusMessage('');
    }
  };

  const handleSubmitCode = async (language: string, code: string) => {
    const currentProb = problems[activeProblemIndex];
    if (!currentProb) return;

    setIsSubmitting(true);
    setExecStatusMessage('Sending submission to official scoring queue...');
    try {
      const idempotencyKey = `sub_${currentProb.id}_${Date.now()}`;
      const res = await ApiService.submitCode(
        currentProb.id,
        language,
        code,
        participant?.id,
        idempotencyKey
      );

      setExecStatusMessage('Submission queued — running hidden test suite on Judge0...');

      const completedSub = await ApiService.pollSubmission(res.submissionId, (intermediate) => {
        setActiveSubmission(intermediate);
      });

      setActiveSubmission(completedSub);

      // Refresh participant score state
      if (contest) {
        const leadRes = await ApiService.getLeaderboard(contest.id);
        const myEntry = leadRes.leaderboard.find(
          (e) => e.userId === (user?.uid || user?.id) || e.participantId === participant?.id
        );
        if (myEntry && participant) {
          setParticipant((prev) =>
            prev
              ? {
                  ...prev,
                  totalScore: myEntry.totalScore,
                  solvedCount: myEntry.solvedCount,
                  problemScores: myEntry.problemScores,
                }
              : null
          );
        }
      }

      if (completedSub.overallVerdict === 'ACCEPTED') {
        showToast(`🎉 Problem Solved! +${completedSub.score} Points awarded!`, 'success');
      } else {
        showToast(`Submission Verdict: ${completedSub.overallVerdict} (${completedSub.passedTests}/${completedSub.totalTests} passed)`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Submission evaluation failed.', 'error');
    } finally {
      setIsSubmitting(false);
      setExecStatusMessage('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0e] flex flex-col items-center justify-center text-gray-200 p-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-pulse shadow-lg shadow-indigo-500/10">
          <Terminal className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Connecting to CodeContest Platform Engine...</span>
        </div>
      </div>
    );
  }

  const activeProblem = problems[activeProblemIndex] || problems[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0e] text-gray-200 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-[#121214] border-green-500/30 text-green-300 shadow-green-500/5'
                : toastMessage.type === 'error'
                ? 'bg-[#121214] border-rose-500/30 text-rose-300 shadow-rose-500/5'
                : 'bg-[#121214] border-white/10 text-gray-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        contest={contest}
        activeView={activeView}
        setActiveView={setActiveView}
        formattedTimer={formatted}
        isTimerUrgent={isUrgent}
        isTimerExpired={isExpired}
        onUserChange={(newUser) => {
          setUser(newUser);
          if (newUser.role === 'PARTICIPANT') {
            const uid = newUser.uid || newUser.id || 'usr-default';
            setParticipant({
              id: `participant-${uid}`,
              contestId: contest?.id || 'collegiate-2026',
              userId: uid,
              name: newUser.displayName,
              email: newUser.email,
              role: 'PARTICIPANT',
              status: 'IN_PROGRESS',
              joinedAt: new Date().toISOString(),
              startedAt: new Date().toISOString(),
              totalScore: 0,
              penaltyTimeMinutes: 0,
              solvedCount: 0,
              problemScores: {},
              riskLevel: 'LOW',
              violationCount: 0,
            });
          }
        }}
        violationCount={violationCount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* VIEW 1: Arena (Problem Statement + Monaco Editor + Test Results Drawer) */}
        {activeView === 'arena' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Problem Statement (45% on desktop) */}
            <div className="w-full lg:w-[45%] h-[400px] lg:h-[calc(100vh-64px)] overflow-hidden">
              <ProblemView
                problems={problems}
                activeProblemIndex={activeProblemIndex}
                onSelectProblem={(idx) => setActiveProblemIndex(idx)}
                participant={participant}
              />
            </div>

            {/* Right Column: Code Editor + Test Drawer (55% on desktop) */}
            <div className="w-full lg:w-[55%] h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-[#0c0c0e]">
              <div className="flex-1 overflow-hidden">
                {activeProblem ? (
                  <CodeEditor
                    problem={activeProblem}
                    participantId={participant?.id}
                    onRunCode={handleRunCode}
                    onSubmitCode={handleSubmitCode}
                    isRunning={isRunning}
                    isSubmitting={isSubmitting}
                    isContestExpired={isExpired}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-500">No problem selected.</div>
                )}
              </div>

              {/* Collapsible Test Execution Results Drawer */}
              <TestResultsPanel
                submission={activeSubmission}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                statusMessage={execStatusMessage}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Leaderboard */}
        {activeView === 'leaderboard' && (
          <div className="flex-1 overflow-y-auto">
            <LeaderboardView
              contestId={contest?.id || 'collegiate-2026'}
              problems={problems}
              currentUserId={user?.id}
            />
          </div>
        )}

        {/* VIEW 3: My Submissions */}
        {activeView === 'submissions' && (
          <div className="flex-1 overflow-y-auto">
            <SubmissionsHistoryView participantId={participant?.id} />
          </div>
        )}

        {/* VIEW 4: Admin Dashboard */}
        {activeView === 'admin' && (
          <div className="flex-1 overflow-y-auto">
            <AdminDashboard />
          </div>
        )}
      </main>

      {/* Pre-Contest Start Modal (Prompted if participant has not clicked Start yet) */}
      {!participant && user?.role === 'PARTICIPANT' && contest && (
        <ContestStartModal
          contest={contest}
          onStart={handleStartContest}
          isLoading={isStartingContest}
          error={startModalError}
        />
      )}

      {/* Integrity Warning Modal */}
      {warningMessage && (
        <IntegrityWarningModal
          message={warningMessage}
          violationCount={violationCount}
          riskLevel={riskLevel}
          onDismiss={dismissWarning}
        />
      )}
    </div>
  );
}
