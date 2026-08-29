import { Contest, Problem, Participant, Submission, IntegrityEvent, ParticipantDraft } from '../src/types';

export const DEFAULT_CONTEST_ID = 'collegiate-cup-2026';

export const INITIAL_PROBLEMS: Problem[] = [
  // ==================================================
  // QUESTION 1 — SMART ROAD BUMP DETECTOR (15 Marks, Easy)
  // ==================================================
  {
    id: 'prob-1-smart-road-bump-detector',
    contestId: DEFAULT_CONTEST_ID,
    order: 1,
    title: 'Smart Road Bump Detector',
    statement: `A vehicle-mounted sensor records the height of a road at N consecutive positions.

A position is considered a "bump" if its height is strictly greater than the heights at both immediately adjacent positions.

For a position i, it is a bump if:

height[i] > height[i-1]
and
height[i] > height[i+1]

The first and last positions cannot be bumps because they do not have two adjacent positions.

You must determine:
1. The total number of bumps.
2. The 1-based positions of all bumps in increasing order.
3. The height of the highest bump.

If there are no bumps, print:
0
None
-1`,
    inputFormat: `The first line contains an integer N, representing the number of road positions.

The second line contains N space-separated integers representing the heights of the road positions.`,
    outputFormat: `Print exactly three lines:

X
P1 P2 P3 ...
H

Where:
- X is the total number of bumps.
- P1 P2 P3 ... are the 1-based positions of the bumps in increasing order.
- H is the height of the highest bump.

If there are no bumps, print exactly:

0
None
-1`,
    constraints: `3 <= N <= 100000\n0 <= height[i] <= 1000000`,
    examples: [
      {
        input: '5\n10 12 15 13 11',
        output: '1\n3\n15',
        explanation: 'At position 3 (1-based), height 15 is strictly greater than 12 and 13.',
      },
      {
        input: '7\n10 15 12 18 14 20 10',
        output: '3\n2 4 6\n20',
        explanation: 'Bumps are located at positions 2 (height 15), 4 (height 18), and 6 (height 20). The highest bump is 20.',
      },
      {
        input: '4\n10 10 10 10',
        output: '0\nNone\n-1',
        explanation: 'All heights are equal, so no position is strictly greater than its neighbors.',
      },
    ],
    difficulty: 'EASY',
    points: 15,
    cpuLimitSeconds: 2.0,
    memoryLimitMb: 256,
    supportedLanguages: ['python', 'cpp', 'java', 'javascript'],
    publicTestCases: [
      {
        input: '5\n10 12 15 13 11',
        expectedOutput: '1\n3\n15',
      },
      {
        input: '7\n10 15 12 18 14 20 10',
        expectedOutput: '3\n2 4 6\n20',
      },
      {
        input: '4\n10 10 10 10',
        expectedOutput: '0\nNone\n-1',
      },
    ],
    hiddenTestCases: [
      {
        input: '3\n5 10 5',
        expectedOutput: '1\n2\n10',
      },
      {
        input: '3\n1 2 3',
        expectedOutput: '0\nNone\n-1',
      },
      {
        input: '3\n3 2 1',
        expectedOutput: '0\nNone\n-1',
      },
      {
        input: '3\n10 2 10',
        expectedOutput: '0\nNone\n-1',
      },
      {
        input: '6\n1 5 5 5 2 1',
        expectedOutput: '0\nNone\n-1',
      },
      {
        input: '5\n2 4 6 10 1',
        expectedOutput: '1\n4\n10',
      },
      {
        input: '5\n1 100 2 3 4',
        expectedOutput: '1\n2\n100',
      },
      {
        input: '9\n1 10 2 20 3 30 4 40 5',
        expectedOutput: '4\n2 4 6 8\n40',
      },
      {
        input: '8\n5 50 10 50 12 50 8 3',
        expectedOutput: '3\n2 4 6\n50',
      },
      {
        input: '6\n999999 1000000 0 500000 1000000 500',
        expectedOutput: '2\n2 5\n1000000',
      },
      {
        input: '5\n0 1 0 1 0',
        expectedOutput: '2\n2 4\n1',
      },
      {
        input: '20\n14 28 19 33 22 15 45 40 12 88 50 20 65 30 11 9 18 12 5 2',
        expectedOutput: '6\n2 4 7 10 13 17\n88',
      },
    ],
  },

  // ==================================================
  // QUESTION 2 — FIRST UNIQUE CHARACTER (10 Marks, Easy)
  // ==================================================
  {
    id: 'prob-2-first-unique-character',
    contestId: DEFAULT_CONTEST_ID,
    order: 2,
    title: 'First Unique Character',
    statement: `Given a string S, find the first character that occurs exactly once in the string.

The characters must be examined from left to right.

The comparison is case-sensitive. Therefore, uppercase and lowercase letters are considered different characters.

If no character occurs exactly once, print -1.`,
    inputFormat: `The first line contains the string S.

The string contains only uppercase and lowercase English letters.`,
    outputFormat: `Print the first character that occurs exactly once.

If no such character exists, print:

-1`,
    constraints: `1 <= |S] <= 100000\nThe string contains only uppercase and lowercase English alphabetic characters.`.replace('|S]', '|S|'),
    examples: [
      {
        input: 'swiss',
        output: 'w',
        explanation: "'w' is the first character examined from left to right that appears exactly once.",
      },
      {
        input: 'aabbcc',
        output: '-1',
        explanation: 'All characters appear at least twice.',
      },
      {
        input: 'leetcode',
        output: 'l',
        explanation: "'l' is the first non-repeating character.",
      },
      {
        input: 'aAbBa',
        output: 'A',
        explanation: "Case-sensitive comparison: 'a' appears twice, 'A' appears once at index 1.",
      },
    ],
    difficulty: 'EASY',
    points: 10,
    cpuLimitSeconds: 2.0,
    memoryLimitMb: 256,
    supportedLanguages: ['python', 'cpp', 'java', 'javascript'],
    publicTestCases: [
      {
        input: 'swiss',
        expectedOutput: 'w',
      },
      {
        input: 'aabbcc',
        expectedOutput: '-1',
      },
      {
        input: 'leetcode',
        expectedOutput: 'l',
      },
      {
        input: 'aAbBa',
        expectedOutput: 'A',
      },
    ],
    hiddenTestCases: [
      {
        input: 'z',
        expectedOutput: 'z',
      },
      {
        input: 'abcdefgh',
        expectedOutput: 'a',
      },
      {
        input: 'xxxxxxxxxx',
        expectedOutput: '-1',
      },
      {
        input: 'aabbccddeeffg',
        expectedOutput: 'g',
      },
      {
        input: 'AaBbCcDdEeFf',
        expectedOutput: 'A',
      },
      {
        input: 'mmMMnNxxY',
        expectedOutput: 'Y',
      },
      {
        input: 'abcdefghijklmnopqrstuvwxyzzabcdefghijklmnopqrstuvwxy',
        expectedOutput: '-1',
      },
      {
        input: 'loveleetcode',
        expectedOutput: 'v',
      },
      {
        input: 'PQRSTpqrstPQRST',
        expectedOutput: 'p',
      },
      {
        input: 'abacabadabacabaeabacabadabacaba',
        expectedOutput: 'e',
      },
      {
        input: 'xxyzww',
        expectedOutput: 'y',
      },
    ],
  },

  // ==================================================
  // QUESTION 3 — MINIMUM COINS (20 Marks, Medium)
  // ==================================================
  {
    id: 'prob-3-minimum-coins',
    contestId: DEFAULT_CONTEST_ID,
    order: 3,
    title: 'Minimum Coins',
    statement: `A vending machine has N different coin denominations.

Given the available denominations and a target amount A, determine the minimum number of coins required to obtain exactly the target amount.

Each coin denomination can be used any number of times.

If it is impossible to obtain exactly the target amount using the available denominations, print -1.`,
    inputFormat: `The first line contains an integer N, representing the number of coin denominations.

The second line contains N space-separated integers representing the coin denominations.

The third line contains an integer A, representing the target amount.`,
    outputFormat: `Print a single integer representing the minimum number of coins required.

If the target amount cannot be formed, print:

-1`,
    constraints: `1 <= N <= 20\n1 <= coin[i] <= 10000\n1 <= A <= 10000\nAll coin denominations are distinct.`,
    examples: [
      {
        input: '4\n1 5 10 25\n30',
        output: '2',
        explanation: '25 + 5 = 30. Therefore, the minimum number of coins is 2.',
      },
      {
        input: '1\n2\n3',
        output: '-1',
        explanation: 'It is impossible to make 3 with only 2-cent coins.',
      },
      {
        input: '3\n1 2 5\n11',
        output: '3',
        explanation: '5 + 5 + 1 = 11. Therefore, the answer is 3.',
      },
      {
        input: '3\n2 4 6\n7',
        output: '-1',
        explanation: 'Sum of even numbers cannot equal odd number 7.',
      },
    ],
    difficulty: 'MEDIUM',
    points: 20,
    cpuLimitSeconds: 2.0,
    memoryLimitMb: 256,
    supportedLanguages: ['python', 'cpp', 'java', 'javascript'],
    publicTestCases: [
      {
        input: '4\n1 5 10 25\n30',
        expectedOutput: '2',
      },
      {
        input: '1\n2\n3',
        expectedOutput: '-1',
      },
      {
        input: '3\n1 2 5\n11',
        expectedOutput: '3',
      },
      {
        input: '3\n2 4 6\n7',
        expectedOutput: '-1',
      },
    ],
    hiddenTestCases: [
      {
        input: '3\n5 10 20\n10',
        expectedOutput: '1',
      },
      {
        input: '3\n1 3 4\n6',
        expectedOutput: '2',
      },
      {
        input: '3\n1 6 9\n12',
        expectedOutput: '2',
      },
      {
        input: '1\n7\n49',
        expectedOutput: '7',
      },
      {
        input: '1\n5\n13',
        expectedOutput: '-1',
      },
      {
        input: '3\n10 20 50\n5',
        expectedOutput: '-1',
      },
      {
        input: '2\n1 5\n1',
        expectedOutput: '1',
      },
      {
        input: '2\n2 5\n1',
        expectedOutput: '-1',
      },
      {
        input: '4\n1 7 23 59\n1428',
        expectedOutput: '28',
      },
      {
        input: '5\n2 4 6 8 10\n999',
        expectedOutput: '-1',
      },
      {
        input: '10\n2 3 5 7 11 13 17 19 23 29\n100',
        expectedOutput: '4',
      },
      {
        input: '5\n1 5 10 21 25\n63',
        expectedOutput: '3',
      },
    ],
  },

  // ==================================================
  // QUESTION 4 — TWO SUM (10 Marks, Easy/Medium)
  // ==================================================
  {
    id: 'prob-4-two-sum',
    contestId: DEFAULT_CONTEST_ID,
    order: 4,
    title: 'Two Sum',
    statement: `You are given an integer array nums containing N elements and an integer target.

Find two different elements whose values add up exactly to target.

Print the 0-based indices of the two elements.

The input guarantees that exactly one valid pair exists.

The order of the two indices does not matter.`,
    inputFormat: `The first line contains an integer N.

The second line contains N space-separated integers.

The third line contains the integer target.`,
    outputFormat: `Print the two 0-based indices separated by a space.`,
    constraints: `2 <= N <= 100000\n-1000000000 <= nums[i] <= 1000000000\n-1000000000 <= target <= 1000000000\nExactly one pair of distinct indices satisfies:\nnums[i] + nums[j] = target`,
    examples: [
      {
        input: '4\n2 7 11 15\n9',
        output: '0 1',
        explanation: 'nums[0] + nums[1] == 2 + 7 == 9, so the indices are 0 1.',
      },
      {
        input: '3\n3 2 4\n6',
        output: '1 2',
        explanation: 'nums[1] + nums[2] == 2 + 4 == 6, so the indices are 1 2.',
      },
      {
        input: '2\n3 3\n6',
        output: '0 1',
        explanation: 'nums[0] + nums[1] == 3 + 3 == 6, so the indices are 0 1.',
      },
    ],
    difficulty: 'EASY',
    points: 10,
    cpuLimitSeconds: 2.0,
    memoryLimitMb: 256,
    supportedLanguages: ['python', 'cpp', 'java', 'javascript'],
    publicTestCases: [
      {
        input: '4\n2 7 11 15\n9',
        expectedOutput: '0 1',
      },
      {
        input: '3\n3 2 4\n6',
        expectedOutput: '1 2',
      },
      {
        input: '2\n3 3\n6',
        expectedOutput: '0 1',
      },
    ],
    hiddenTestCases: [
      {
        input: '4\n-1 -2 -3 -4\n-6',
        expectedOutput: '1 3',
      },
      {
        input: '4\n-50 10 20 50\n0',
        expectedOutput: '0 3',
      },
      {
        input: '5\n-10 20 30 -5 15\n5',
        expectedOutput: '0 4',
      },
      {
        input: '6\n100 5 9 14 22 500\n600',
        expectedOutput: '0 5',
      },
      {
        input: '4\n1000000000 500000000 300000000 500000000\n1000000000',
        expectedOutput: '1 3',
      },
      {
        input: '5\n0 4 3 0 9\n0',
        expectedOutput: '0 3',
      },
      {
        input: '2\n-100 200\n100',
        expectedOutput: '0 1',
      },
      {
        input: '10\n1 4 8 12 19 25 33 42 55 70\n37',
        expectedOutput: '3 5',
      },
      {
        input: '5\n10 -25 30 -15 5\n-40',
        expectedOutput: '1 3',
      },
      {
        input: '7\n8 8 2 8 8 5 8\n7',
        expectedOutput: '2 5',
      },
      {
        input: '6\n1 7 4 9 4 12\n8',
        expectedOutput: '2 4',
      },
    ],
  },

  // ==================================================
  // QUESTION 5 — EMERGENCY ROUTE (20 Marks, Medium)
  // ==================================================
  {
    id: 'prob-5-emergency-route',
    contestId: DEFAULT_CONTEST_ID,
    order: 5,
    title: 'Emergency Route',
    statement: `An emergency vehicle must travel through a city represented by a rectangular grid.

Each cell contains either:

0 → Open road
1 → Blocked road

The vehicle starts at the top-left cell (0, 0) and must reach the bottom-right cell (R-1, C-1).

The vehicle can move from one cell to an adjacent cell in any of the following four directions:

Up
Down
Left
Right

Diagonal movement is not allowed.

The vehicle can move only through open-road cells.

Determine whether the vehicle can reach the destination.

The starting cell and destination cell must also be open.`,
    inputFormat: `The first line contains two integers R and C, representing the number of rows and columns.

The next R lines each contain C space-separated integers representing the grid.`,
    outputFormat: `If the destination can be reached, print:

Path Exists

Otherwise, print:

No Path`,
    constraints: `1 <= R, C <= 100\ngrid[i][j] is either 0 or 1`,
    examples: [
      {
        input: '3 3\n0 0 1\n1 0 1\n0 0 0',
        output: 'Path Exists',
        explanation: 'Path from (0,0) -> (0,1) -> (1,1) -> (2,1) -> (2,2) exists entirely on open roads (0).',
      },
      {
        input: '3 3\n0 1 1\n1 1 0\n0 0 0',
        output: 'No Path',
        explanation: 'Vehicle is trapped at (0,0) with adjacent cells blocked (1).',
      },
      {
        input: '1 1\n0',
        output: 'Path Exists',
        explanation: 'Single cell grid with open road is already at the destination.',
      },
      {
        input: '1 1\n1',
        output: 'No Path',
        explanation: 'Starting cell is blocked.',
      },
    ],
    difficulty: 'MEDIUM',
    points: 20,
    cpuLimitSeconds: 2.5,
    memoryLimitMb: 256,
    supportedLanguages: ['python', 'cpp', 'java', 'javascript'],
    publicTestCases: [
      {
        input: '3 3\n0 0 1\n1 0 1\n0 0 0',
        expectedOutput: 'Path Exists',
      },
      {
        input: '3 3\n0 1 1\n1 1 0\n0 0 0',
        expectedOutput: 'No Path',
      },
      {
        input: '1 1\n0',
        expectedOutput: 'Path Exists',
      },
      {
        input: '1 1\n1',
        expectedOutput: 'No Path',
      },
    ],
    hiddenTestCases: [
      {
        input: '3 3\n1 0 0\n0 0 0\n0 0 0',
        expectedOutput: 'No Path',
      },
      {
        input: '3 3\n0 0 0\n0 0 0\n0 0 1',
        expectedOutput: 'No Path',
      },
      {
        input: '1 5\n0 0 0 0 0',
        expectedOutput: 'Path Exists',
      },
      {
        input: '1 5\n0 0 1 0 0',
        expectedOutput: 'No Path',
      },
      {
        input: '5 1\n0\n0\n0\n0\n0',
        expectedOutput: 'Path Exists',
      },
      {
        input: '5 1\n0\n0\n1\n0\n0',
        expectedOutput: 'No Path',
      },
      {
        input: '5 5\n0 0 0 0 0\n1 1 1 1 0\n0 0 0 0 0\n0 1 1 1 1\n0 0 0 0 0',
        expectedOutput: 'Path Exists',
      },
      {
        input: '4 4\n0 0 0 1\n0 0 1 0\n0 1 0 0\n1 0 0 0',
        expectedOutput: 'No Path',
      },
      {
        input: '5 5\n0 0 0 0 0\n1 1 1 1 0\n0 0 0 1 0\n0 1 0 0 0\n0 1 1 1 0',
        expectedOutput: 'Path Exists',
      },
      {
        input: '4 4\n0 0 0 0\n0 0 0 0\n0 0 0 0\n0 0 0 0',
        expectedOutput: 'Path Exists',
      },
      {
        input: '3 3\n0 1 1\n1 1 1\n1 1 0',
        expectedOutput: 'No Path',
      },
      {
        input: '8 8\n0 0 1 0 0 0 0 0\n1 0 1 0 1 1 1 0\n0 0 0 0 1 0 0 0\n0 1 1 0 1 0 1 1\n0 0 1 0 0 0 1 0\n1 0 1 1 1 0 1 0\n1 0 0 0 1 0 0 0\n1 1 1 0 0 0 1 0',
        expectedOutput: 'Path Exists',
      },
    ],
  },
];

export const INITIAL_CONTEST: Contest = {
  id: DEFAULT_CONTEST_ID,
  title: 'Annual Intercollegiate Coding Championship 2026',
  description: 'The premier collegiate programming competition. Test your algorithmic prowess across exactly 5 coding problems under strict time and resource bounds (Total 75 Marks).',
  startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 105 * 60 * 1000).toISOString(),
  durationMinutes: 120,
  maxParticipants: 100,
  accessCode: 'CODE2026',
  rules: [
    'Independent work only. Communication between participants during contest hours is strictly prohibited.',
    'Only the provided in-browser coding environment and supported language standard libraries may be used.',
    'Submissions are evaluated against hidden test cases. Scoring is server-authoritative based on passed test cases.',
    'Browser tab switches, loss of window focus, and fullscreen exits are monitored and logged in real time.',
    'Tie-breaker rule: Highest total score first; earlier time of achieving the score breaks ties.',
  ],
  allowedLanguages: ['python', 'cpp', 'java', 'javascript'],
  status: 'RUNNING',
  settings: {
    maxRunsPerMinute: 3,
    maxRunsPer10Minutes: 10,
    maxSubmissionsPerProblem: 20,
    maxTotalSubmissions: 50,
    copyPasteRestricted: true,
    fullscreenRequired: true,
    showLeaderboardToParticipants: true,
    autoQueueOnJudge0Down: true,
  },
  createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export class ContestStore {
  private static instance: ContestStore;

  public contest: Contest = { ...INITIAL_CONTEST };
  public problems: Problem[] = [...INITIAL_PROBLEMS];
  public participants: Map<string, Participant> = new Map();
  public submissions: Map<string, Submission> = new Map();
  public drafts: Map<string, ParticipantDraft> = new Map();
  public integrityEvents: IntegrityEvent[] = [];
  public idempotencyKeys: Map<string, string> = new Map();

  private constructor() {
    this.seedSampleParticipants();
  }

  public static getInstance(): ContestStore {
    if (!ContestStore.instance) {
      ContestStore.instance = new ContestStore();
    }
    return ContestStore.instance;
  }

  private seedSampleParticipants() {
    const samples = [
      { name: 'Alex Rivera', email: 'alex.r@mit.edu', score: 75, solved: 5, penalty: 42, risk: 'LOW' as const },
      { name: 'Priya Sharma', email: 'priya.s@iitd.ac.in', score: 65, solved: 4, penalty: 38, risk: 'LOW' as const },
      { name: 'David Zhang', email: 'david.z@stanford.edu', score: 55, solved: 4, penalty: 54, risk: 'LOW' as const },
      { name: 'Elena Rostova', email: 'elena.r@spbu.ru', score: 45, solved: 3, penalty: 29, risk: 'LOW' as const },
      { name: 'Marcus Sterling', email: 'marcus.s@oxford.ac.uk', score: 35, solved: 2, penalty: 61, risk: 'MEDIUM' as const },
      { name: 'Hana Tanaka', email: 'hana.t@u-tokyo.ac.jp', score: 25, solved: 2, penalty: 47, risk: 'LOW' as const },
      { name: 'Lucas Silva', email: 'lucas.s@usp.br', score: 15, solved: 1, penalty: 18, risk: 'LOW' as const },
      { name: 'Amina Al-Mansoor', email: 'amina.m@kaust.edu.sa', score: 10, solved: 1, penalty: 12, risk: 'LOW' as const },
    ];

    samples.forEach((s, idx) => {
      const id = `participant-seed-${idx + 1}`;
      this.participants.set(id, {
        id,
        userId: `uid-seed-${idx + 1}`,
        contestId: DEFAULT_CONTEST_ID,
        name: s.name,
        email: s.email,
        joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        lastActiveAt: new Date().toISOString(),
        totalScore: s.score,
        solvedCount: s.solved,
        penaltyTimeMinutes: s.penalty,
        lastScoreUpdate: new Date(Date.now() - (60 - idx * 5) * 60 * 1000).toISOString(),
        status: 'ACTIVE',
        riskLevel: s.risk,
        violationCount: s.risk === 'MEDIUM' ? 2 : 0,
        problemScores: {
          'prob-1-smart-road-bump-detector': { solved: s.score >= 15, score: s.score >= 15 ? 15 : 0, attempts: 1, solvedAt: new Date().toISOString() },
          'prob-2-first-unique-character': { solved: s.score >= 25, score: s.score >= 25 ? 10 : 0, attempts: 1 },
          'prob-3-minimum-coins': { solved: s.score >= 45, score: s.score >= 45 ? 20 : 0, attempts: 2 },
          'prob-4-two-sum': { solved: s.score >= 55, score: s.score >= 55 ? 10 : 0, attempts: 1 },
          'prob-5-emergency-route': { solved: s.score >= 75, score: s.score >= 75 ? 20 : 0, attempts: 3 },
        },
      });
    });
  }

  // Get problem without hidden test cases (Sanitized for participant consumption)
  public getSanitizedProblems(): Problem[] {
    return this.problems.map((p) => {
      const { hiddenTestCases, ...sanitized } = p;
      return {
        ...sanitized,
        hiddenTestCasesCount: hiddenTestCases ? hiddenTestCases.length : 0,
      };
    });
  }

  public getProblemById(id: string): Problem | undefined {
    return this.problems.find((p) => p.id === id);
  }

  public getParticipant(id: string): Participant | undefined {
    return this.participants.get(id);
  }

  public getParticipantByUserId(userId: string): Participant | undefined {
    for (const p of this.participants.values()) {
      if (p.userId === userId) return p;
    }
    return undefined;
  }

  public saveParticipant(participant: Participant) {
    this.participants.set(participant.id, participant);
  }

  public saveSubmission(submission: Submission) {
    this.submissions.set(submission.id, submission);
    if (submission.idempotencyKey) {
      this.idempotencyKeys.set(submission.idempotencyKey, submission.id);
    }
  }

  public getSubmission(id: string): Submission | undefined {
    return this.submissions.get(id);
  }

  public getSubmissionByIdempotencyKey(key: string): Submission | undefined {
    const subId = this.idempotencyKeys.get(key);
    return subId ? this.submissions.get(subId) : undefined;
  }

  public addIntegrityEvent(event: IntegrityEvent) {
    this.integrityEvents.unshift(event);
    if (this.integrityEvents.length > 1000) {
      this.integrityEvents.pop();
    }
  }

  public getDraft(participantId: string, problemId: string): ParticipantDraft | undefined {
    return this.drafts.get(`${participantId}_${problemId}`);
  }

  public saveDraft(participantId: string, problemId: string, draft: ParticipantDraft) {
    this.drafts.set(`${participantId}_${problemId}`, draft);
  }
}
