export type UserRole = 'ADMIN' | 'PARTICIPANT';

export type ContestStatus = 'DRAFT' | 'PUBLISHED' | 'RUNNING' | 'ENDED';

export type SubmissionStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';

export type ExecutionType = 'RUN' | 'SUBMIT';

export type Verdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'EVALUATING'
  | 'QUEUED';

export type IntegrityEventType =
  | 'VISIBILITY_CHANGE'
  | 'WINDOW_BLUR'
  | 'WINDOW_FOCUS'
  | 'FULLSCREEN_EXIT'
  | 'FULLSCREEN_ENTER'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CUT_ATTEMPT'
  | 'CONTEXT_MENU'
  | 'SUSPICIOUS_SHORTCUT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UserProfile {
  uid: string;
  id?: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Problem {
  id: string;
  contestId: string;
  order: number;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: ProblemExample[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  cpuLimitSeconds: number;
  memoryLimitMb: number;
  supportedLanguages: string[];
  publicTestCases: TestCase[];
  hiddenTestCasesCount?: number;
  // hiddenTestCases are strictly server-side and excluded in public problem API
  hiddenTestCases?: TestCase[];
}

export interface ContestSettings {
  maxRunsPerMinute: number;
  maxRunsPer10Minutes: number;
  maxSubmissionsPerProblem: number;
  maxTotalSubmissions: number;
  copyPasteRestricted: boolean;
  fullscreenRequired: boolean;
  showLeaderboardToParticipants: boolean;
  autoQueueOnJudge0Down: boolean;
}

export interface Contest {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  maxParticipants: number;
  accessCode: string;
  rules: string[];
  allowedLanguages: string[];
  status: ContestStatus;
  settings: ContestSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseResult {
  testIndex: number;
  isHidden: boolean;
  passed: boolean;
  verdict: Verdict;
  executionTimeSec?: number;
  memoryKb?: number;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  message?: string;
  // Input/expected output only included for public tests
  input?: string;
  expectedOutput?: string;
}

export interface Submission {
  id: string;
  idempotencyKey: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  contestId: string;
  problemId: string;
  problemTitle?: string;
  language: string;
  code: string;
  type: ExecutionType;
  status: SubmissionStatus;
  overallVerdict?: Verdict;
  score: number;
  maxScore: number;
  passedTests: number;
  totalTests: number;
  testResults: TestCaseResult[];
  judge0Tokens?: { token: string; testIndex: number; isHidden: boolean }[];
  compileOutput?: string;
  error?: string;
  retryCount: number;
  createdAt: string;
  completedAt?: string;
  executionDurationMs?: number;
}

export interface ParticipantScore {
  solved: boolean;
  score: number;
  attempts: number;
  solvedAt?: string;
  bestSubmissionId?: string;
}

export interface Participant {
  id: string;
  userId: string;
  contestId: string;
  name: string;
  email: string;
  joinedAt: string;
  startedAt?: string;
  lastActiveAt: string;
  totalScore: number;
  solvedCount: number;
  penaltyTimeMinutes: number;
  lastScoreUpdate: string;
  status: 'REGISTERED' | 'ACTIVE' | 'SUBMITTED' | 'DISQUALIFIED';
  riskLevel: RiskLevel;
  violationCount: number;
  problemScores: Record<string, ParticipantScore>;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  userId: string;
  name: string;
  email: string;
  totalScore: number;
  solvedCount: number;
  penaltyTimeMinutes: number;
  lastScoreUpdate: string;
  riskLevel: RiskLevel;
  problemScores: Record<string, ParticipantScore>;
}

export interface IntegrityEvent {
  id: string;
  participantId: string;
  participantName: string;
  contestId: string;
  eventType: IntegrityEventType;
  timestamp: string;
  durationMs?: number;
  sessionId: string;
  details?: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  judge0: {
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    endpoint: string;
    latencyMs: number;
    lastPing: string;
    error?: string;
  };
  database: {
    status: 'ONLINE' | 'OFFLINE';
    latencyMs: number;
  };
  queue: {
    queuedCount: number;
    processingCount: number;
    completedCount: number;
    failedCount: number;
    avgWaitTimeMs: number;
    avgExecTimeMs: number;
  };
  activeUsers: number;
  uptimeSeconds: number;
}

export interface ParticipantDraft {
  problemId: string;
  language: string;
  code: string;
  updatedAt: string;
}

export interface LoadTestResult {
  totalUsers: number;
  durationSeconds: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsPerSecond: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  queuePeak: number;
  logs: string[];
}
