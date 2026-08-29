import { Request, Response, NextFunction } from 'express';
import { ContestStore } from './contestStore';

interface RateRecord {
  timestamps: number[];
}

export class RateLimiter {
  private static runPerMinuteMap = new Map<string, RateRecord>(); // key: participantId
  private static runPer10MinMap = new Map<string, RateRecord>();
  private static integrityEventsMap = new Map<string, RateRecord>();
  private static generalApiMap = new Map<string, RateRecord>(); // key: ip

  public static checkRunLimit(participantId: string): { allowed: boolean; message?: string; retryAfterSec?: number } {
    const now = Date.now();
    const store = ContestStore.getInstance();
    const settings = store.contest.settings;

    // 1-minute window
    let record1m = this.runPerMinuteMap.get(participantId);
    if (!record1m) {
      record1m = { timestamps: [] };
      this.runPerMinuteMap.set(participantId, record1m);
    }
    record1m.timestamps = record1m.timestamps.filter((t) => now - t < 60 * 1000);

    if (record1m.timestamps.length >= (settings.maxRunsPerMinute || 3)) {
      const oldest = record1m.timestamps[0];
      const retryAfterSec = Math.ceil((60 * 1000 - (now - oldest)) / 1000);
      return {
        allowed: false,
        message: `Run code rate limit reached (Max ${settings.maxRunsPerMinute} runs/min). Please wait ${retryAfterSec}s.`,
        retryAfterSec,
      };
    }

    // 10-minute window
    let record10m = this.runPer10MinMap.get(participantId);
    if (!record10m) {
      record10m = { timestamps: [] };
      this.runPer10MinMap.set(participantId, record10m);
    }
    record10m.timestamps = record10m.timestamps.filter((t) => now - t < 10 * 60 * 1000);

    if (record10m.timestamps.length >= (settings.maxRunsPer10Minutes || 10)) {
      const oldest = record10m.timestamps[0];
      const retryAfterSec = Math.ceil((10 * 60 * 1000 - (now - oldest)) / 1000);
      return {
        allowed: false,
        message: `Run code 10-minute burst limit reached (Max ${settings.maxRunsPer10Minutes} runs/10min). Please wait ${retryAfterSec}s.`,
        retryAfterSec,
      };
    }

    // Record this run
    record1m.timestamps.push(now);
    record10m.timestamps.push(now);
    return { allowed: true };
  }

  public static checkSubmitLimit(
    participantId: string,
    problemId: string
  ): { allowed: boolean; message?: string } {
    const store = ContestStore.getInstance();
    const settings = store.contest.settings;
    const participant = store.getParticipant(participantId);

    if (!participant) {
      return { allowed: false, message: 'Participant not registered in this contest.' };
    }

    const problemScores = participant.problemScores[problemId];
    const problemAttempts = problemScores ? problemScores.attempts : 0;

    if (problemAttempts >= (settings.maxSubmissionsPerProblem || 20)) {
      return {
        allowed: false,
        message: `Submission limit for this problem reached (Max ${settings.maxSubmissionsPerProblem} submissions).`,
      };
    }

    // Calculate total submissions
    let totalAttempts = 0;
    for (const p in participant.problemScores) {
      totalAttempts += participant.problemScores[p].attempts || 0;
    }

    if (totalAttempts >= (settings.maxTotalSubmissions || 50)) {
      return {
        allowed: false,
        message: `Contest total submission limit reached (Max ${settings.maxTotalSubmissions} submissions).`,
      };
    }

    return { allowed: true };
  }

  public static checkIntegrityBatchLimit(participantId: string): boolean {
    const now = Date.now();
    let record = this.integrityEventsMap.get(participantId);
    if (!record) {
      record = { timestamps: [] };
      this.integrityEventsMap.set(participantId, record);
    }
    // Max 30 events per minute
    record.timestamps = record.timestamps.filter((t) => now - t < 60 * 1000);
    if (record.timestamps.length >= 30) {
      return false; // drop excess spam
    }
    record.timestamps.push(now);
    return true;
  }

  public static generalApiMiddleware(maxReqsPerMin = 120) {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      let record = RateLimiter.generalApiMap.get(ip);
      if (!record) {
        record = { timestamps: [] };
        RateLimiter.generalApiMap.set(ip, record);
      }
      record.timestamps = record.timestamps.filter((t) => now - t < 60 * 1000);

      if (record.timestamps.length >= maxReqsPerMin) {
        res.setHeader('Retry-After', '60');
        res.status(429).json({
          error: 'Too many requests. Please slow down.',
          retryAfterSeconds: 60,
        });
        return;
      }

      record.timestamps.push(now);
      next();
    };
  }
}
