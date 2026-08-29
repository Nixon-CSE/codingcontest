import { LeaderboardEntry, Participant } from '../src/types';
import { ContestStore } from './contestStore';

export function updateParticipantScore(
  participantId: string,
  problemId: string,
  newScore: number,
  isFullySolved: boolean,
  submissionId: string
): Participant | null {
  const store = ContestStore.getInstance();
  const participant = store.getParticipant(participantId);
  if (!participant) return null;

  const currentProblemScore = participant.problemScores[problemId] || {
    solved: false,
    score: 0,
    attempts: 0,
  };

  const attempts = (currentProblemScore.attempts || 0) + 1;
  const previousScore = currentProblemScore.score || 0;
  const wasSolved = currentProblemScore.solved;

  // Best score policy: only increase or keep best score
  const updatedScore = Math.max(previousScore, newScore);
  const nowSolved = wasSolved || isFullySolved;
  const scoreChanged = updatedScore > previousScore;

  participant.problemScores[problemId] = {
    solved: nowSolved,
    score: updatedScore,
    attempts,
    solvedAt: nowSolved && !wasSolved ? new Date().toISOString() : currentProblemScore.solvedAt,
    bestSubmissionId: updatedScore > previousScore ? submissionId : currentProblemScore.bestSubmissionId,
  };

  // Recalculate participant aggregate total score
  let totalScore = 0;
  let solvedCount = 0;

  for (const pId in participant.problemScores) {
    const pData = participant.problemScores[pId];
    totalScore += pData.score || 0;
    if (pData.solved) solvedCount++;
  }

  participant.totalScore = totalScore;
  participant.solvedCount = solvedCount;
  if (scoreChanged) {
    participant.lastScoreUpdate = new Date().toISOString();
  }
  participant.lastActiveAt = new Date().toISOString();

  store.saveParticipant(participant);
  return participant;
}

export function computeLeaderboard(contestId: string): LeaderboardEntry[] {
  const store = ContestStore.getInstance();
  const participants = Array.from(store.participants.values()).filter(
    (p) => p.contestId === contestId && p.status !== 'DISQUALIFIED'
  );

  // Sorting rule:
  // 1. Higher total score first (descending)
  // 2. Earlier lastScoreUpdate time first (ascending timestamp)
  // 3. Higher solved count first
  // 4. Lower penalty time
  participants.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.solvedCount !== a.solvedCount) {
      return b.solvedCount - a.solvedCount;
    }
    const timeA = new Date(a.lastScoreUpdate || a.joinedAt).getTime();
    const timeB = new Date(b.lastScoreUpdate || b.joinedAt).getTime();
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return a.penaltyTimeMinutes - b.penaltyTimeMinutes;
  });

  return participants.map((p, index) => ({
    rank: index + 1,
    participantId: p.id,
    userId: p.userId,
    name: p.name,
    email: p.email,
    totalScore: p.totalScore,
    solvedCount: p.solvedCount,
    penaltyTimeMinutes: p.penaltyTimeMinutes,
    lastScoreUpdate: p.lastScoreUpdate,
    riskLevel: p.riskLevel,
    problemScores: p.problemScores,
  }));
}
