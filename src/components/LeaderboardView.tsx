import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Users,
  Award,
} from 'lucide-react';
import { LeaderboardEntry, Problem } from '../types';
import { ApiService } from '../api';

export interface LeaderboardViewProps {
  contestId: string;
  problems: Problem[];
  currentUserId?: string;
}

export function LeaderboardView({ contestId, problems, currentUserId }: LeaderboardViewProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchLeaderboard = async () => {
    try {
      const res = await ApiService.getLeaderboard(contestId);
      setEntries(res.leaderboard);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Failed to refresh leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLeaderboard, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, [contestId, autoRefresh]);

  const filteredEntries = entries.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Rank', 'Name', 'Email', 'Total Score', 'Solved Count', 'Penalty Minutes', 'Risk Level'];
    const rows = entries.map((e) => [
      e.rank,
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.email}"`,
      e.totalScore,
      e.solvedCount,
      e.penaltyTimeMinutes,
      e.riskLevel,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leaderboard-${contestId}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shadow-sm">
          <Medal className="w-4 h-4 text-amber-400" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded bg-gray-400/10 border border-gray-400/30 flex items-center justify-center text-gray-300 font-bold text-xs">
          <Medal className="w-4 h-4 text-gray-300" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded bg-orange-700/10 border border-orange-700/30 flex items-center justify-center text-orange-400 font-bold text-xs">
          <Medal className="w-4 h-4 text-orange-400" />
        </div>
      );
    }
    return <span className="font-mono text-gray-500 font-semibold text-xs">{rank}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-gray-200 space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121214] border border-white/5 rounded-xl p-5 shadow-2xl flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Live Contest Leaderboard</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-bold uppercase tracking-wider">
                {entries.length} Contestants
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              Rankings recalculate incrementally upon submission evaluation • Synced {lastUpdated || 'just now'}
            </p>
          </div>
        </div>

        {/* Controls: Search, Auto-Refresh, Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
            <input
              id="search-leaderboard-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search participant..."
              className="bg-[#16161a] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>

          <button
            id="btn-refresh-leaderboard"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#16161a] border border-white/10 hover:bg-white/5 transition text-gray-300"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-[#121214] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#16161a] border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Solved</th>
                <th className="py-3 px-4 text-center hidden md:table-cell">Penalty</th>
                {problems.map((p, idx) => (
                  <th key={p.id} className="py-3 px-3 text-center hidden lg:table-cell">
                    Q{idx + 1} ({p.points}pt)
                  </th>
                ))}
                <th className="py-3 px-4 text-center hidden sm:table-cell">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6 + problems.length} className="py-12 text-center text-gray-500">
                    No participants matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isCurrent = entry.userId === currentUserId || `participant-${entry.userId}` === entry.participantId;

                  return (
                    <tr
                      key={entry.participantId}
                      className={`transition ${
                        isCurrent
                          ? 'bg-indigo-600/10 hover:bg-indigo-600/15 font-semibold text-white'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <td className="py-3 px-4 text-center flex items-center justify-center">
                        {getRankBadge(entry.rank)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{entry.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-600 text-white font-mono uppercase font-bold tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">{entry.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-sm text-indigo-400">{entry.totalScore}</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-semibold px-2 py-0.5 rounded bg-white/5 text-gray-200 border border-white/5">
                          {entry.solvedCount} / {problems.length}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-gray-500 hidden md:table-cell">
                        {entry.penaltyTimeMinutes}m
                      </td>

                      {/* Problem Solved Columns */}
                      {problems.map((p) => {
                        const pScore = entry.problemScores[p.id];
                        const isSolved = pScore?.solved;
                        const score = pScore?.score || 0;
                        const attempts = pScore?.attempts || 0;

                        return (
                          <td key={p.id} className="py-3 px-3 text-center hidden lg:table-cell">
                            {isSolved ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2 py-0.5 rounded font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/20 text-[11px]">
                                  +{score}
                                </span>
                                {attempts > 1 && (
                                  <span className="text-[9px] text-gray-500 font-mono">({attempts} tries)</span>
                                )}
                              </div>
                            ) : score > 0 ? (
                              <span className="px-1.5 py-0.5 rounded font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px]">
                                {score}
                              </span>
                            ) : attempts > 0 ? (
                              <span className="px-1.5 py-0.5 rounded font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px]">
                                -{attempts}
                              </span>
                            ) : (
                              <span className="text-gray-600 font-mono">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Integrity Status Badge */}
                      <td className="py-3 px-4 text-center hidden sm:table-cell">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            entry.riskLevel === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : entry.riskLevel === 'MEDIUM'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}
                        >
                          {entry.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
