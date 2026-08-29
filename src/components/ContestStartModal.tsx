import { useState, FormEvent } from 'react';
import { ShieldCheck, Maximize, AlertCircle, Clock, BookOpen, Lock, Terminal } from 'lucide-react';
import { Contest } from '../types';

export interface ContestStartModalProps {
  contest: Contest;
  onStart: (accessCode: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function ContestStartModal({ contest, onStart, isLoading, error }: ContestStartModalProps) {
  const [accessCode, setAccessCode] = useState(contest.accessCode || '');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    await onStart(accessCode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-white/10 rounded-xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] text-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">{contest.title}</h2>
            <p className="text-xs text-gray-500">Official Collegiate Competitive Programming Arena</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-6 leading-relaxed bg-white/5 p-4 rounded-lg border border-white/5">
          {contest.description}
        </p>

        {/* Contest Quick Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#16161a] p-3 rounded-lg border border-white/5">
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Duration</span>
            </div>
            <div className="text-sm font-semibold text-white">{contest.durationMinutes} Minutes</div>
          </div>

          <div className="bg-[#16161a] p-3 rounded-lg border border-white/5">
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Problems</span>
            </div>
            <div className="text-sm font-semibold text-white">5 Coding Challenges</div>
          </div>

          <div className="bg-[#16161a] p-3 rounded-lg border border-white/5 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5 mb-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Languages</span>
            </div>
            <div className="text-sm font-semibold text-white">Python, C++, Java, JS</div>
          </div>
        </div>

        {/* Integrity & Anti-Cheating Notice */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span className="uppercase tracking-wider">Contest Integrity & Proctoring Telemetry</span>
          </div>
          <ul className="text-xs text-amber-300/80 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Fullscreen Enforcement:</strong> You must enter and stay in fullscreen mode during the contest.
            </li>
            <li>
              <strong>Focus Monitoring:</strong> Tab switches, minimizing windows, or loss of focus are logged as integrity events.
            </li>
            <li>
              <strong>Evaluation Queue:</strong> All code is evaluated on Judge0 isolated sandboxes against server-only hidden test cases.
            </li>
            <li>
              <strong>Violation Policy:</strong> 1st & 2nd violations trigger warnings; 3rd violation marks session as HIGH RISK for review.
            </li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Contest Access Code
            </label>
            <div className="relative">
              <input
                id="contest-access-code-input"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter access code (e.g. CODE2026)"
                className="w-full bg-[#16161a] border border-white/10 rounded-lg px-4 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                required
              />
              <Lock className="w-4 h-4 text-gray-500 absolute right-4 top-3" />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              id="rules-agreement-checkbox"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-[#16161a] text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300">
              I have read and agree to the contest rules, timing constraints, and automated integrity monitoring telemetry.
            </span>
          </label>

          <button
            id="btn-start-contest"
            type="submit"
            disabled={!agreed || isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-xs uppercase tracking-wider"
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Maximize className="w-4 h-4" />
                <span>Enter Fullscreen & Start Contest</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
