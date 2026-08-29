import {
  Contest,
  Problem,
  Submission,
  LeaderboardEntry,
  Participant,
  IntegrityEvent,
  SystemHealth,
  UserProfile,
  LoadTestResult,
} from './types';

const API_BASE = '/api';

export class ApiService {
  private static token: string | null = localStorage.getItem('contest_auth_token');

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('contest_auth_token', token);
    } else {
      localStorage.removeItem('contest_auth_token');
    }
  }

  public static getToken(): string | null {
    return this.token || localStorage.getItem('contest_auth_token');
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Rate limit exceeded. Please wait a moment.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Dev Switch / Quick Login
  public static async devLogin(role: 'ADMIN' | 'PARTICIPANT', customName?: string, customEmail?: string) {
    const data = await this.request<{ token: string; user: UserProfile }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role, customName, customEmail }),
    });
    this.setToken(data.token);
    return data.user;
  }

  public static async getCurrentUser() {
    return this.request<{ user: UserProfile }>('/auth/me');
  }

  // Contest APIs
  public static async getContest(contestId: string) {
    return this.request<{
      contest: Contest;
      serverTime: string;
      isActive: boolean;
      timeRemainingSec: number;
    }>(`/contests/${contestId}`);
  }

  public static async startContest(contestId: string, accessCode: string, agreedToRules = true) {
    return this.request<{
      success: boolean;
      participant: Participant;
      serverTime: string;
      contestStartTime: string;
      contestEndTime: string;
    }>(`/contests/${contestId}/start`, {
      method: 'POST',
      body: JSON.stringify({ accessCode, agreedToRules }),
    });
  }

  public static async getProblems(contestId: string) {
    return this.request<{ problems: Problem[] }>(`/contests/${contestId}/problems`);
  }

  public static async getProblem(problemId: string) {
    return this.request<{ problem: Problem }>(`/problems/${problemId}`);
  }

  public static async getLeaderboard(contestId: string) {
    return this.request<{
      contestId: string;
      totalParticipants: number;
      leaderboard: LeaderboardEntry[];
      updatedAt: string;
    }>(`/contests/${contestId}/leaderboard`);
  }

  // Execution & Submissions
  public static async runCode(problemId: string, language: string, code: string, participantId?: string) {
    return this.request<{
      message: string;
      submissionId: string;
      status: string;
    }>(`/problems/${problemId}/run`, {
      method: 'POST',
      body: JSON.stringify({ language, code, participantId }),
    });
  }

  public static async submitCode(
    problemId: string,
    language: string,
    code: string,
    participantId?: string,
    idempotencyKey?: string
  ) {
    return this.request<{
      message: string;
      submissionId: string;
      status: string;
      idempotencyKey: string;
    }>(`/problems/${problemId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ language, code, participantId, idempotencyKey }),
    });
  }

  public static async getSubmission(submissionId: string) {
    return this.request<{ submission: Submission }>(`/submissions/${submissionId}`);
  }

  public static async getParticipantSubmissions(participantId: string) {
    return this.request<{ submissions: Submission[] }>(`/submissions/participant/${participantId}`);
  }

  // Poll submission until completed with exponential backoff
  public static async pollSubmission(submissionId: string, onUpdate?: (sub: Submission) => void): Promise<Submission> {
    const intervals = [1000, 2000, 3000, 4000, 5000]; // 1s, 2s, 3s, 4s, 5s
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
      const res = await this.getSubmission(submissionId);
      if (onUpdate) onUpdate(res.submission);

      // Terminal state check - stop polling immediately
      if (
        res.submission.status === 'COMPLETED' ||
        res.submission.status === 'FAILED' ||
        res.submission.status === 'TIMEOUT'
      ) {
        return res.submission;
      }

      const delayMs = intervals[Math.min(i, intervals.length - 1)];
      await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error('Evaluation timed out. Your submission is still in queue.');
  }

  // Drafts
  public static async getDraft(problemId: string, participantId?: string) {
    const q = participantId ? `?participantId=${encodeURIComponent(participantId)}` : '';
    return this.request<{ draft: { problemId: string; language: string; code: string; updatedAt: string } | null }>(
      `/drafts/${problemId}${q}`
    );
  }

  public static async saveDraft(problemId: string, language: string, code: string, participantId?: string) {
    return this.request<{ success: boolean; savedAt: string }>(`/drafts/${problemId}`, {
      method: 'POST',
      body: JSON.stringify({ language, code, participantId }),
    });
  }

  // Integrity telemetry
  public static async sendIntegrityEvent(
    eventType: string,
    participantId?: string,
    details?: string,
    durationMs?: number,
    sessionId?: string
  ) {
    return this.request<{
      success: boolean;
      eventId: string;
      violationCount: number;
      riskLevel: string;
    }>('/integrity-events', {
      method: 'POST',
      body: JSON.stringify({ eventType, participantId, details, durationMs, sessionId }),
    });
  }

  // Admin APIs
  public static async getAdminOverview() {
    return this.request<{
      contest: Contest;
      stats: {
        totalParticipants: number;
        activeParticipants: number;
        highRiskCount: number;
        totalSubmissions: number;
        acceptedSubmissions: number;
        queueStats: any;
      };
      systemHealth: SystemHealth;
    }>('/admin/overview');
  }

  public static async getAdminParticipants() {
    return this.request<{ participants: Participant[] }>('/admin/participants');
  }

  public static async getAdminSubmissions() {
    return this.request<{ submissions: Submission[] }>('/admin/submissions');
  }

  public static async getAdminIntegrityEvents() {
    return this.request<{ events: IntegrityEvent[] }>('/admin/integrity-events');
  }

  public static async updateContestStatus(status: string, durationMinutes?: number, startTime?: string, endTime?: string) {
    return this.request<{ success: boolean; contest: Contest }>('/admin/contest/status', {
      method: 'POST',
      body: JSON.stringify({ status, durationMinutes, startTime, endTime }),
    });
  }

  public static async updateContestSettings(settings: any) {
    return this.request<{ success: boolean; settings: any }>('/admin/contest/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  public static async getAdminProblems() {
    return this.request<{ problems: Problem[] }>('/admin/problems');
  }

  public static async getAdminReferenceSolutions() {
    return this.request<{ solutions: Record<string, any> }>('/admin/reference-solutions');
  }

  public static async addHiddenTestCase(problemId: string, input: string, expectedOutput: string) {
    return this.request<{ success: boolean; hiddenTestCasesCount: number }>(
      `/admin/problems/${problemId}/hidden-tests`,
      {
        method: 'POST',
        body: JSON.stringify({ input, expectedOutput }),
      }
    );
  }

  public static async updateProblem(problemId: string, updates: Partial<Problem>) {
    return this.request<{ success: boolean; problem: Problem }>(`/admin/problems/${problemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public static async pingJudge0() {
    return this.request<{ ping: { ok: boolean; latencyMs: number; error?: string }; judge0Config: any }>(
      '/admin/health/ping-judge0',
      { method: 'POST' }
    );
  }

  public static async simulateLoadTest(numParticipants = 50) {
    return this.request<{ success: boolean; result: LoadTestResult }>('/admin/test/simulate-load', {
      method: 'POST',
      body: JSON.stringify({ numParticipants }),
    });
  }
}
