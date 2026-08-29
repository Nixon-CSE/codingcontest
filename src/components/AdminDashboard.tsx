import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileCode2,
  ShieldAlert,
  Activity,
  Play,
  Square,
  RefreshCw,
  Clock,
  Server,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Download,
  Settings,
  Edit,
  Plus,
  BarChart3,
  Cpu,
  Database,
  Lock,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  Copy,
  BookOpen,
  Code2,
} from 'lucide-react';
import {
  Contest,
  Participant,
  Submission,
  IntegrityEvent,
  SystemHealth,
  Problem,
  LoadTestResult,
} from '../types';
import { ApiService } from '../api';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'problems' | 'participants' | 'submissions' | 'integrity' | 'health' | 'loadtest'
  >('overview');

  const [contest, setContest] = useState<Contest | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityEvent[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [referenceSolutions, setReferenceSolutions] = useState<Record<string, any>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingContest, setIsUpdatingContest] = useState(false);

  // Problem management state
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<Record<string, 'python' | 'cpp' | 'java' | 'javascript'>>({});
  const [newHiddenInput, setNewHiddenInput] = useState('');
  const [newHiddenOutput, setNewHiddenOutput] = useState('');
  const [selectedProbForHiddenTest, setSelectedProbForHiddenTest] = useState<string | null>(null);
  const [isAddingHiddenTest, setIsAddingHiddenTest] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Load Test simulation state
  const [simUsers, setSimUsers] = useState<number>(50);
  const [isLoadTesting, setIsLoadTesting] = useState(false);
  const [loadTestResult, setLoadTestResult] = useState<LoadTestResult | null>(null);

  // Judge0 Ping state
  const [isPingingJudge0, setIsPingingJudge0] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);

  const fetchAdminData = async () => {
    try {
      const overviewRes = await ApiService.getAdminOverview();
      setContest(overviewRes.contest);
      setStats(overviewRes.stats);
      setHealth(overviewRes.systemHealth);

      const [pRes, sRes, iRes, probRes, refSolRes] = await Promise.all([
        ApiService.getAdminParticipants(),
        ApiService.getAdminSubmissions(),
        ApiService.getAdminIntegrityEvents(),
        ApiService.getAdminProblems().catch(() => ApiService.getProblems(overviewRes.contest.id)),
        ApiService.getAdminReferenceSolutions().catch(() => ({ solutions: {} })),
      ]);

      setParticipants(pRes.participants);
      setSubmissions(sRes.submissions);
      setIntegrityEvents(iRes.events);
      setProblems(probRes.problems);
      if (refSolRes.solutions) {
        setReferenceSolutions(refSolRes.solutions);
      }
    } catch (err) {
      console.warn('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 8000); // 8s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const updateContestStatus = async (status: 'DRAFT' | 'PUBLISHED' | 'RUNNING' | 'ENDED') => {
    setIsUpdatingContest(true);
    try {
      let startTime = contest?.startTime;
      let endTime = contest?.endTime;

      if (status === 'RUNNING') {
        startTime = new Date().toISOString();
        endTime = new Date(Date.now() + (contest?.durationMinutes || 120) * 60 * 1000).toISOString();
      }

      await ApiService.updateContestStatus(status, contest?.durationMinutes, startTime, endTime);
      await fetchAdminData();
    } finally {
      setIsUpdatingContest(false);
    }
  };

  const handlePingJudge0 = async () => {
    setIsPingingJudge0(true);
    try {
      const res = await ApiService.pingJudge0();
      setPingResult(res);
      await fetchAdminData();
    } finally {
      setIsPingingJudge0(false);
    }
  };

  const handleAddHiddenTest = async (problemId: string) => {
    if (!newHiddenInput.trim() || !newHiddenOutput.trim()) {
      alert('Please provide both input and expected output.');
      return;
    }
    setIsAddingHiddenTest(true);
    try {
      await ApiService.addHiddenTestCase(problemId, newHiddenInput.trim(), newHiddenOutput.trim());
      setNewHiddenInput('');
      setNewHiddenOutput('');
      setSelectedProbForHiddenTest(null);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Failed to add test case: ${err.message}`);
    } finally {
      setIsAddingHiddenTest(false);
    }
  };

  const copySolution = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runLoadTest = async () => {
    setIsLoadTesting(true);
    setLoadTestResult(null);
    try {
      const res = await ApiService.simulateLoadTest(simUsers);
      setLoadTestResult(res.result);
      await fetchAdminData();
    } catch (err: any) {
      alert(`Load test failed: ${err.message}`);
    } finally {
      setIsLoadTesting(false);
    }
  };

  const totalPoints = problems.reduce((acc, p) => acc + p.points, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-gray-200 space-y-6">
      {/* Admin Title & Quick Actions */}
      <div className="bg-[#121214] border border-white/5 rounded-xl p-5 shadow-2xl flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Contest Control Cockpit</h1>
              <span
                className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  contest?.status === 'RUNNING'
                    ? 'bg-green-500/10 text-green-400 border-green-500/30 animate-pulse'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {contest?.status || 'RUNNING'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                5 Questions • 75 Total Marks
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Multi-participant orchestrator • Server-authoritative timer & Judge0 queue monitor
            </p>
          </div>
        </div>

        {/* Contest Status Control Buttons */}
        <div className="flex items-center gap-2">
          {contest?.status !== 'RUNNING' ? (
            <button
              id="btn-start-contest-admin"
              onClick={() => updateContestStatus('RUNNING')}
              disabled={isUpdatingContest}
              className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-green-600/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Contest Live</span>
            </button>
          ) : (
            <button
              id="btn-end-contest-admin"
              onClick={() => updateContestStatus('ENDED')}
              disabled={isUpdatingContest}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>End Contest</span>
            </button>
          )}

          <button
            id="btn-admin-refresh"
            onClick={fetchAdminData}
            className="p-1.5 rounded-lg bg-[#16161a] border border-white/10 hover:bg-white/5 transition text-gray-300"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#121214] border border-white/5 p-4 rounded-xl shadow-lg">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between mb-1">
            <span>Total Participants</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{stats?.totalParticipants || participants.length}</div>
          <div className="text-[11px] text-green-400 font-mono mt-1">
            {stats?.activeParticipants || 0} active now
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 p-4 rounded-xl shadow-lg">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between mb-1">
            <span>Submissions</span>
            <FileCode2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{stats?.totalSubmissions || submissions.length}</div>
          <div className="text-[11px] text-gray-400 font-mono mt-1">
            {stats?.acceptedSubmissions || 0} Accepted
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 p-4 rounded-xl shadow-lg">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between mb-1">
            <span>Queue Workload</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {stats?.queueStats?.processingCount || 0} active
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            {stats?.queueStats?.queuedCount || 0} waiting in queue
          </div>
        </div>

        <div className="bg-[#121214] border border-white/5 p-4 rounded-xl shadow-lg">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between mb-1">
            <span>Integrity Flags</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {stats?.highRiskCount || 0} High Risk
          </div>
          <div className="text-[11px] text-gray-500 font-mono mt-1">
            {integrityEvents.length} events logged
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/5 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Contest Overview', icon: Activity },
          { id: 'problems', label: `Problem Set (${problems.length})`, icon: BookOpen },
          { id: 'participants', label: `Participants (${participants.length})`, icon: Users },
          { id: 'submissions', label: `Submissions (${submissions.length})`, icon: FileCode2 },
          { id: 'integrity', label: `Integrity Log (${integrityEvents.length})`, icon: ShieldAlert },
          { id: 'health', label: 'System & Queue Health', icon: Server },
          { id: 'loadtest', label: '50-User Concurrency Benchmark', icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-500/50 shadow-md'
                  : 'bg-[#121214] text-gray-400 border-white/5 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contest Rules & Info */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-5 space-y-4 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Contest Configuration</span>
              </h3>
              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Access Code:</span>
                  <span className="font-mono font-bold text-white">{contest?.accessCode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-mono">{contest?.durationMinutes} Minutes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Run Code Rate Limit:</span>
                  <span className="font-mono">
                    {contest?.settings.maxRunsPerMinute} / min ({contest?.settings.maxRunsPer10Minutes} / 10min)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Max Submissions / Problem:</span>
                  <span className="font-mono">{contest?.settings.maxSubmissionsPerProblem}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Fullscreen Required:</span>
                  <span className="font-mono text-green-400">Enforced</span>
                </div>
              </div>
            </div>

            {/* Problem Point Breakdown */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  <span>Active 5-Problem Set Breakdown</span>
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                  Total: {totalPoints} Marks
                </span>
              </div>

              <div className="space-y-2">
                {problems.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#16161a] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400">Q{p.order || idx + 1}</span>
                      <span className="font-semibold text-gray-200">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 font-mono border border-white/5">
                        {p.difficulty}
                      </span>
                      <span className="font-mono font-bold text-indigo-400">{p.points} Marks</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Problems Management */}
      {activeTab === 'problems' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-[#121214] border border-white/5 rounded-xl p-4 shadow-lg">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Contest Problem Set (Exactly 5 Questions • {totalPoints} Total Marks)</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Official competition questions. Hidden test cases and reference solutions are securely restricted to administrators.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {problems.map((p, idx) => {
              const isExpanded = expandedProblemId === p.id;
              const refSol = referenceSolutions[p.id];
              const selectedLang = activeLangTab[p.id] || 'python';
              const hiddenTests = p.hiddenTestCases || [];

              return (
                <div
                  key={p.id}
                  className="bg-[#121214] border border-white/5 rounded-xl shadow-xl overflow-hidden transition"
                >
                  {/* Problem Header Bar */}
                  <div
                    onClick={() => setExpandedProblemId(isExpanded ? null : p.id)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition flex-wrap gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold font-mono text-xs flex items-center justify-center">
                        Q{p.order || idx + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                          <span>{p.title}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              p.difficulty === 'EASY'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}
                          >
                            {p.difficulty}
                          </span>
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1 font-mono">
                          <span>Marks: <strong className="text-indigo-400">{p.points}</strong></span>
                          <span>•</span>
                          <span>Public Tests: {p.publicTestCases?.length || 0}</span>
                          <span>•</span>
                          <span>Hidden Tests: {hiddenTests.length || p.hiddenTestCasesCount || 0}</span>
                          <span>•</span>
                          <span>Time: {p.cpuLimitSeconds}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                        {isExpanded ? 'Hide Details' : 'View Full Details & Tests'}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Problem Details (Admin View) */}
                  {isExpanded && (
                    <div className="border-t border-white/5 p-5 space-y-6 bg-[#0e0e11] text-xs">
                      {/* Statement */}
                      <div>
                        <h4 className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-2">
                          Problem Statement
                        </h4>
                        <div className="bg-[#121214] p-4 rounded-lg border border-white/5 text-gray-300 leading-relaxed whitespace-pre-line">
                          {p.statement}
                        </div>
                      </div>

                      {/* Formats & Constraints */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#121214] p-3.5 rounded-lg border border-white/5 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Input Format</span>
                          <p className="text-gray-300 whitespace-pre-line">{p.inputFormat}</p>
                        </div>
                        <div className="bg-[#121214] p-3.5 rounded-lg border border-white/5 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Output Format</span>
                          <p className="text-gray-300 whitespace-pre-line">{p.outputFormat}</p>
                        </div>
                        <div className="bg-[#121214] p-3.5 rounded-lg border border-white/5 space-y-1 font-mono">
                          <span className="text-[10px] uppercase font-bold text-orange-400 font-sans">Constraints</span>
                          <p className="text-gray-400 whitespace-pre-line">{p.constraints}</p>
                        </div>
                      </div>

                      {/* Hidden Test Cases Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-rose-400 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Server-Authoritative Hidden Test Cases ({hiddenTests.length})</span>
                          </h4>
                          <button
                            onClick={() => setSelectedProbForHiddenTest(selectedProbForHiddenTest === p.id ? null : p.id)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Hidden Test Case</span>
                          </button>
                        </div>

                        {/* Add Hidden Test Form */}
                        {selectedProbForHiddenTest === p.id && (
                          <div className="bg-[#16161a] border border-indigo-500/30 p-4 rounded-lg space-y-3 animate-in fade-in">
                            <h5 className="font-bold text-white text-xs">New Hidden Test Case for {p.title}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">Standard Input (stdin):</label>
                                <textarea
                                  rows={3}
                                  value={newHiddenInput}
                                  onChange={(e) => setNewHiddenInput(e.target.value)}
                                  placeholder="e.g. 5\n10 20 30 20 10"
                                  className="w-full bg-[#121214] border border-white/10 rounded p-2 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">Expected Output (stdout):</label>
                                <textarea
                                  rows={3}
                                  value={newHiddenOutput}
                                  onChange={(e) => setNewHiddenOutput(e.target.value)}
                                  placeholder="e.g. 1\n3\n30"
                                  className="w-full bg-[#121214] border border-white/10 rounded p-2 text-xs text-green-400 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedProbForHiddenTest(null)}
                                className="px-3 py-1 rounded bg-white/5 text-gray-400 hover:bg-white/10"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddHiddenTest(p.id)}
                                disabled={isAddingHiddenTest}
                                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50"
                              >
                                {isAddingHiddenTest ? 'Saving...' : 'Save Hidden Test'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* List of Hidden Tests */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {hiddenTests.map((t, tidx) => (
                            <div
                              key={tidx}
                              className="bg-[#121214] border border-white/5 rounded-lg p-3 space-y-1.5 font-mono text-[11px]"
                            >
                              <div className="flex items-center justify-between text-gray-400 font-sans text-[10px]">
                                <span className="font-bold text-gray-500">Hidden Test #{tidx + 1}</span>
                                <span className="text-rose-400 font-mono">Restricted</span>
                              </div>
                              <div className="bg-black/30 p-2 rounded border border-white/5">
                                <span className="text-gray-500 text-[10px] font-sans block">In:</span>
                                <div className="text-indigo-300 overflow-x-auto whitespace-pre">{t.input}</div>
                              </div>
                              <div className="bg-black/30 p-2 rounded border border-white/5">
                                <span className="text-gray-500 text-[10px] font-sans block">Expected Out:</span>
                                <div className="text-green-400 overflow-x-auto whitespace-pre">{t.expectedOutput}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Official Reference Solution (Admin Only) */}
                      {refSol && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Official Reference Solution ({refSol.timeComplexity} / {refSol.spaceComplexity})</span>
                            </h4>

                            <div className="flex items-center gap-1">
                              {(['python', 'cpp', 'java', 'javascript'] as const).map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() =>
                                    setActiveLangTab((prev) => ({ ...prev, [p.id]: lang }))
                                  }
                                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase transition border ${
                                    selectedLang === lang
                                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                                      : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                                  }`}
                                >
                                  {lang}
                                </button>
                              ))}

                              <button
                                onClick={() => copySolution(refSol[selectedLang], `${p.id}_${selectedLang}`)}
                                className="ml-2 px-2.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] flex items-center gap-1 border border-white/10"
                              >
                                {copiedKey === `${p.id}_${selectedLang}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="bg-[#121214] border border-white/5 rounded-lg p-3.5 font-mono text-xs overflow-x-auto text-emerald-300/90 leading-relaxed max-h-72">
                            <pre>{refSol[selectedLang]}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Participants Table */}
      {activeTab === 'participants' && (
        <div className="bg-[#121214] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161a] border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4 text-center">Score (Max 75)</th>
                  <th className="py-3 px-4 text-center">Solved (Max 5)</th>
                  <th className="py-3 px-4 text-center">Penalty</th>
                  <th className="py-3 px-4 text-center">Integrity Risk</th>
                  <th className="py-3 px-4">Joined / Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 text-gray-300 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{p.email}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">{p.totalScore}</td>
                    <td className="py-3 px-4 text-center font-mono">{p.solvedCount} / 5</td>
                    <td className="py-3 px-4 text-center font-mono text-gray-500">{p.penaltyTimeMinutes}m</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase border ${
                          p.riskLevel === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : p.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}
                      >
                        {p.riskLevel} ({p.violationCount || 0})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px] font-mono">
                      {new Date(p.startedAt || p.joinedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Submissions */}
      {activeTab === 'submissions' && (
        <div className="bg-[#121214] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161a] border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">Lang</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 text-gray-300 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{s.participantName}</td>
                    <td className="py-3 px-4 text-gray-300">{s.problemTitle || s.problemId}</td>
                    <td className="py-3 px-4 font-mono uppercase text-gray-400">{s.language}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-200">
                        {s.overallVerdict || s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-indigo-400">
                      {s.score} / {s.maxScore}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-gray-500">
                      {s.executionDurationMs ? `${s.executionDurationMs}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Integrity Events */}
      {activeTab === 'integrity' && (
        <div className="bg-[#121214] border border-white/5 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#16161a] border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {integrityEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-white/5 text-gray-300 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{evt.participantName}</td>
                    <td className="py-3 px-4 font-mono text-indigo-400">{evt.eventType}</td>
                    <td className="py-3 px-4 text-gray-400">{evt.details || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          evt.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : evt.severity === 'WARNING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/5 text-gray-400 border-white/10'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: System & Queue Health */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Judge0 Health */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>Judge0 Execution Engine</span>
                </h3>
                <button
                  id="btn-ping-judge0"
                  onClick={handlePingJudge0}
                  disabled={isPingingJudge0}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPingingJudge0 ? 'animate-spin' : ''}`} />
                  <span>Ping Judge0</span>
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`font-mono font-bold ${
                      health?.judge0.status === 'ONLINE' ? 'text-green-400' : 'text-amber-400'
                    }`}
                  >
                    {health?.judge0.status || 'ONLINE'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">API Endpoint:</span>
                  <span className="font-mono text-gray-400 truncate max-w-xs">{health?.judge0.endpoint}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Latency:</span>
                  <span className="font-mono">{health?.judge0.latencyMs || 25}ms</span>
                </div>
                {health?.judge0.error && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    {health.judge0.error}
                  </div>
                )}
              </div>
            </div>

            {/* Queue & Memory Throughput */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-5 space-y-4 shadow-xl">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-green-400" />
                <span>Asynchronous Queue Engine</span>
              </h3>
              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Active Workers:</span>
                  <span className="font-mono text-green-400 font-bold">5 Concurrent Workers</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Queued Jobs:</span>
                  <span className="font-mono font-bold text-white">{health?.queue.queuedCount || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Completed Jobs:</span>
                  <span className="font-mono text-green-400 font-bold">{health?.queue.completedCount || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-500">Avg Execution Latency:</span>
                  <span className="font-mono">{health?.queue.avgExecTimeMs || 85}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 50-User Concurrency Benchmark */}
      {activeTab === 'loadtest' && (
        <div className="space-y-6">
          <div className="bg-[#121214] border border-white/5 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-400" />
                  <span>50-Participant Live Concurrency Stress Test</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Simulates 50 simultaneous competitors joining the contest, retrieving problems, executing RUN code, and bursting SUBMIT evaluations into the Judge0 queue.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#16161a] px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                  <span className="text-gray-400">Simulated Users:</span>
                  <select
                    value={simUsers}
                    onChange={(e) => setSimUsers(Number(e.target.value))}
                    className="bg-transparent text-white font-bold focus:outline-none"
                  >
                    <option value={20} className="bg-[#16161a]">20 Users</option>
                    <option value={50} className="bg-[#16161a]">50 Users (Standard)</option>
                    <option value={100} className="bg-[#16161a]">100 Users (Stress)</option>
                  </select>
                </div>

                <button
                  id="btn-run-load-test"
                  onClick={runLoadTest}
                  disabled={isLoadTesting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-rose-600/30 disabled:opacity-50 uppercase tracking-wider"
                >
                  {isLoadTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Simulating {simUsers} Users...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Launch Load Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Load Test Results */}
            {loadTestResult && (
              <div className="bg-[#16161a] border border-white/5 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#121214] p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Throughput</div>
                    <div className="text-lg font-bold font-mono text-green-400">
                      {loadTestResult.requestsPerSecond} req/s
                    </div>
                  </div>
                  <div className="bg-[#121214] p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Avg Latency</div>
                    <div className="text-lg font-bold font-mono text-indigo-400">
                      {loadTestResult.avgLatencyMs}ms
                    </div>
                  </div>
                  <div className="bg-[#121214] p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">P95 Latency</div>
                    <div className="text-lg font-bold font-mono text-amber-400">
                      {loadTestResult.p95LatencyMs}ms
                    </div>
                  </div>
                  <div className="bg-[#121214] p-3 rounded-lg border border-white/5">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 font-bold">Success Rate</div>
                    <div className="text-lg font-bold font-mono text-green-400">
                      {Math.round((loadTestResult.successfulRequests / loadTestResult.totalRequests) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs text-gray-300 bg-[#121214] p-3 rounded-lg border border-white/5 max-h-60 overflow-y-auto">
                  {loadTestResult.logs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
