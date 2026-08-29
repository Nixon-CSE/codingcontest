import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Copy,
  Check,
  Code2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Problem, Participant } from '../types';

export interface ProblemViewProps {
  problems: Problem[];
  activeProblemIndex: number;
  onSelectProblem: (index: number) => void;
  participant?: Participant | null;
}

export function ProblemView({
  problems,
  activeProblemIndex,
  onSelectProblem,
  participant,
}: ProblemViewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const problem = problems[activeProblemIndex] || problems[0];

  if (!problem) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No problems loaded yet.</p>
      </div>
    );
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'MEDIUM':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'HARD':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-white/5 text-gray-300 border-white/10';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111114] border-r border-white/5 text-gray-300 overflow-hidden">
      {/* Problem Tabs Navigation (Q1 - Q5) */}
      <div className="bg-[#16161a] border-b border-white/5 px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-thin flex-none">
        {problems.map((p, idx) => {
          const scoreData = participant?.problemScores[p.id];
          const isSolved = scoreData?.solved;
          const hasAttempted = scoreData && scoreData.attempts > 0;
          const isActive = idx === activeProblemIndex;

          return (
            <button
              key={p.id}
              id={`problem-tab-${idx + 1}`}
              onClick={() => onSelectProblem(idx)}
              className={`flex items-center gap-1.5 px-3 h-8 rounded text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-sm'
                  : isSolved
                  ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                  : hasAttempted
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:text-gray-200 hover:bg-white/10'
              }`}
            >
              <span>Q{p.order || idx + 1}</span>
              {isSolved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : hasAttempted ? (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              ) : null}
              <span className="text-[10px] opacity-75 font-mono">({p.points}pt)</span>
            </button>
          );
        })}
      </div>

      {/* Problem Content Container (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm">
        {/* Title & Metadata Badges */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 block mb-1">
                Problem 0{activeProblemIndex + 1}
              </span>
              <h1 className="text-xl font-semibold text-white tracking-tight">{problem.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded border ${getDifficultyBadge(
                  problem.difficulty
                )}`}
              >
                {problem.difficulty}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-600/10 text-indigo-300 border border-indigo-500/30">
                {problem.points} Points
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 font-mono pt-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Time limit: {problem.cpuLimitSeconds}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-gray-500" />
              <span>Memory limit: {problem.memoryLimitMb}MB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-gray-500" />
              <span>Public Tests: {problem.publicTestCases?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Problem Statement */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Problem Statement</h3>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-line text-sm">
            {problem.statement}
          </div>
        </section>

        {/* Input & Output Format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Input Format</h4>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{problem.inputFormat}</p>
          </section>

          <section className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Output Format</h4>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{problem.outputFormat}</p>
          </section>
        </div>

        {/* Constraints */}
        <section className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-2 font-mono text-xs">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-400 font-sans">Constraints</h4>
          <p className="text-gray-400 whitespace-pre-line leading-relaxed">{problem.constraints}</p>
        </section>

        {/* Examples Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sample Test Cases</h3>
          {problem.examples.map((ex, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-lg overflow-hidden text-xs">
              <div className="bg-white/5 px-4 py-2 font-semibold text-gray-300 border-b border-white/5 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-gray-400">Sample #{idx + 1}</span>
                <button
                  onClick={() => copyToClipboard(ex.input, idx)}
                  className="text-gray-400 hover:text-gray-200 transition flex items-center gap-1.5 text-[11px]"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Input</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 space-y-3 font-mono">
                <div>
                  <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase tracking-widest mb-1.5">
                    Input:
                  </span>
                  <pre className="bg-black/40 p-3 rounded font-mono text-xs text-indigo-300 overflow-x-auto border border-white/5">
                    {ex.input}
                  </pre>
                </div>

                <div>
                  <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase tracking-widest mb-1.5">
                    Output:
                  </span>
                  <pre className="bg-black/40 p-3 rounded font-mono text-xs text-green-400 overflow-x-auto border border-white/5">
                    {ex.output}
                  </pre>
                </div>

                {ex.explanation && (
                  <div>
                    <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase tracking-widest mb-1">
                      Explanation:
                    </span>
                    <p className="text-gray-400 font-sans text-xs leading-relaxed">{ex.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
