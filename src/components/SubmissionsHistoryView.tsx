import { useState, useEffect } from 'react';
import { FileCode2, CheckCircle2, XCircle, Clock, AlertTriangle, Terminal, Code, Eye } from 'lucide-react';
import { Submission, Verdict } from '../types';
import { ApiService } from '../api';

export interface SubmissionsHistoryViewProps {
  participantId?: string;
}

export function SubmissionsHistoryView({ participantId }: SubmissionsHistoryViewProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSubs() {
      if (!participantId) return;
      try {
        const res = await ApiService.getParticipantSubmissions(participantId);
        setSubmissions(res.submissions);
      } catch (err) {
        console.warn('Could not load participant submissions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSubs();
  }, [participantId]);

  const getVerdictStyle = (verdict?: Verdict) => {
    switch (verdict) {
      case 'ACCEPTED':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'WRONG_ANSWER':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'TIME_LIMIT_EXCEEDED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'COMPILATION_ERROR':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'RUNTIME_ERROR':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-white/5 text-gray-300 border-white/10';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-gray-200 space-y-6">
      {/* Header */}
      <div className="bg-[#121214] border border-white/5 rounded-xl p-5 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Submissions Ledger</h1>
            <p className="text-xs text-gray-500">History of your code runs and official problem evaluations</p>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-[#121214] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16161a] border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Problem</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Pass Rate</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No submissions recorded yet for this contest.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 text-gray-300 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      {new Date(sub.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 font-semibold text-white">
                      {sub.problemTitle || sub.problemId}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          sub.type === 'SUBMIT'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                      >
                        {sub.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono uppercase text-gray-400">{sub.language}</td>

                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getVerdictStyle(sub.overallVerdict)}`}>
                        {sub.overallVerdict || sub.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">
                      {sub.score} / {sub.maxScore}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-gray-300">
                      {sub.passedTests} / {sub.totalTests}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSub(sub)}
                        className="px-2.5 py-1 rounded bg-[#16161a] hover:bg-white/5 text-gray-300 border border-white/10 transition text-[11px] flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-gray-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">{selectedSub.problemTitle}</h3>
                <span className="text-xs font-mono text-gray-500">
                  {selectedSub.language} • {new Date(selectedSub.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-gray-400 hover:text-white text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-1">
                  Submitted Code:
                </span>
                <pre className="bg-black/40 p-4 rounded-lg border border-white/5 font-mono text-xs text-gray-300 overflow-x-auto">
                  {selectedSub.code}
                </pre>
              </div>

              {selectedSub.compileOutput && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block mb-1">
                    Compile Output:
                  </span>
                  <pre className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 font-mono text-xs text-rose-300 overflow-x-auto">
                    {selectedSub.compileOutput}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
