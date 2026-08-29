import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  Terminal,
  Loader2,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { Submission, TestCaseResult, Verdict } from '../types';

export interface TestResultsPanelProps {
  submission: Submission | null;
  isRunning: boolean;
  isSubmitting: boolean;
  statusMessage?: string;
  onClose?: () => void;
}

export function TestResultsPanel({
  submission,
  isRunning,
  isSubmitting,
  statusMessage,
}: TestResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!isRunning && !isSubmitting && !submission) {
    return null;
  }

  const getVerdictBadge = (verdict?: Verdict) => {
    switch (verdict) {
      case 'ACCEPTED':
        return {
          bg: 'bg-green-500/10 border-green-500/20 text-green-400',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
          label: 'Accepted',
        };
      case 'WRONG_ANSWER':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Wrong Answer',
        };
      case 'TIME_LIMIT_EXCEEDED':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Time Limit Exceeded',
        };
      case 'COMPILATION_ERROR':
        return {
          bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
          label: 'Compilation Error',
        };
      case 'RUNTIME_ERROR':
        return {
          bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />,
          label: 'Runtime Error',
        };
      default:
        return {
          bg: 'bg-white/5 border-white/10 text-gray-300',
          icon: <Terminal className="w-3.5 h-3.5 text-gray-400" />,
          label: verdict || 'Evaluating',
        };
    }
  };

  const badge = getVerdictBadge(submission?.overallVerdict);
  const activeTest = submission?.testResults[activeTab];

  return (
    <div className="border-t border-white/5 bg-[#0c0c0e] text-gray-300 transition-all flex flex-col max-h-72 flex-none">
      {/* Panel Header */}
      <div className="bg-[#121214] px-4 py-2 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Execution Drawer {submission ? `(${submission.type === 'RUN' ? 'Sample Run' : 'Official Submission'})` : ''}
            </span>
          </div>

          {/* Status Indicator */}
          {isRunning || isSubmitting || submission?.status === 'QUEUED' || submission?.status === 'PROCESSING' ? (
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              <span className="text-[11px]">{statusMessage || (submission?.status === 'QUEUED' ? 'Queued — evaluating...' : 'Evaluating on Judge0...')}</span>
            </div>
          ) : submission ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded border text-xs font-semibold ${badge.bg}`}>
              {badge.icon}
              <span className="text-[11px] font-mono uppercase">{badge.label}</span>
              {submission.type === 'SUBMIT' && (
                <span className="ml-1 text-[11px] font-mono opacity-90">
                  ({submission.passedTests}/{submission.totalTests} tests passed • {submission.score}/{submission.maxScore} pts)
                </span>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {submission?.executionDurationMs && (
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider hidden sm:inline">
              Duration: {submission.executionDurationMs}ms
            </span>
          )}
          <button
            id="btn-toggle-test-drawer"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Test Content */}
      {isExpanded && (
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs bg-[#0c0c0e]">
          {isRunning || isSubmitting ? (
            <div className="py-6 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <p className="font-medium text-gray-200 text-xs">{statusMessage || 'Dispatching payload to Judge0 Execution Queue...'}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Asynchronous worker pool isolation</p>
            </div>
          ) : submission ? (
            <>
              {/* If compilation error occurred */}
              {submission.compileOutput && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                  <div className="font-semibold text-rose-300 mb-1 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Compiler Output</span>
                  </div>
                  <pre className="bg-black/40 p-2.5 rounded border border-white/5 font-mono text-rose-300 text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {submission.compileOutput}
                  </pre>
                </div>
              )}

              {/* Test Case Tabs */}
              {submission.testResults.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 border-b border-white/5 pb-2 mb-3 overflow-x-auto">
                    {submission.testResults.map((tc, idx) => (
                      <button
                        key={idx}
                        id={`test-case-tab-${idx + 1}`}
                        onClick={() => setActiveTab(idx)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition border ${
                          activeTab === idx
                            ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-gray-200'
                        }`}
                      >
                        {tc.passed ? (
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        <span>{tc.isHidden ? `Hidden Test ${idx + 1}` : `Test ${idx + 1}`}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Test Case Details */}
                  {activeTest && (
                    <div className="bg-[#121214] border border-white/5 rounded-lg p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold uppercase tracking-tight text-[10px] ${
                              activeTest.passed
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {activeTest.verdict}
                          </span>
                          {activeTest.isHidden && (
                            <span className="bg-white/5 px-2 py-0.5 rounded text-gray-400 border border-white/5 text-[10px]">
                              🔒 Hidden Evaluation Case
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-gray-500">
                          {activeTest.executionTimeSec !== undefined && (
                            <span>Time: {activeTest.executionTimeSec}s</span>
                          )}
                          {activeTest.memoryKb !== undefined && (
                            <span>Memory: {(activeTest.memoryKb / 1024).toFixed(1)}MB</span>
                          )}
                        </div>
                      </div>

                      {activeTest.isHidden ? (
                        <p className="text-gray-400 text-xs italic bg-white/5 p-3 rounded border border-white/5">
                          Hidden test case inputs and expected outputs are secured on the server to maintain contest integrity.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
                          <div>
                            <span className="text-gray-500 block font-sans font-bold uppercase tracking-widest text-[10px] mb-1">
                              Input:
                            </span>
                            <pre className="bg-black/40 p-2.5 rounded border border-white/5 text-gray-200 overflow-x-auto max-h-24">
                              {activeTest.input}
                            </pre>
                          </div>

                          <div>
                            <span className="text-gray-500 block font-sans font-bold uppercase tracking-widest text-[10px] mb-1">
                              Your Output:
                            </span>
                            <pre
                              className={`p-2.5 rounded border overflow-x-auto max-h-24 ${
                                activeTest.passed
                                  ? 'bg-black/40 border-white/5 text-green-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                              }`}
                            >
                              {activeTest.stdout || (activeTest.stderr ? `Error: ${activeTest.stderr}` : 'No output')}
                            </pre>
                          </div>

                          <div>
                            <span className="text-gray-500 block font-sans font-bold uppercase tracking-widest text-[10px] mb-1">
                              Expected Output:
                            </span>
                            <pre className="bg-black/40 p-2.5 rounded border border-white/5 text-indigo-300 overflow-x-auto max-h-24">
                              {activeTest.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
