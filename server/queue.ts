import { Submission, TestCaseResult, Verdict } from '../src/types';
import { ContestStore } from './contestStore';
import { Judge0Client } from './judge0';
import { updateParticipantScore } from './scoring';

export interface QueueJob {
  submissionId: string;
  enqueuedAt: number;
  attempts: number;
}

export class SubmissionQueue {
  private static instance: SubmissionQueue;
  private queue: QueueJob[] = [];
  private activeJobs = new Set<string>();
  private maxConcurrency = 5;
  private maxRetries = 3;
  private isProcessing = false;
  private judge0: Judge0Client;
  private store: ContestStore;

  // Telemetry metrics
  private totalQueued = 0;
  private totalCompleted = 0;
  private totalFailed = 0;
  private totalWaitTimeMs = 0;
  private totalExecTimeMs = 0;

  private constructor() {
    this.judge0 = new Judge0Client();
    this.store = ContestStore.getInstance();
    // Start background loop
    setInterval(() => this.processNext(), 100);
  }

  public static getInstance(): SubmissionQueue {
    if (!SubmissionQueue.instance) {
      SubmissionQueue.instance = new SubmissionQueue();
    }
    return SubmissionQueue.instance;
  }

  public getStats() {
    return {
      queuedCount: this.queue.length,
      processingCount: this.activeJobs.size,
      completedCount: this.totalCompleted,
      failedCount: this.totalFailed,
      avgWaitTimeMs: this.totalCompleted > 0 ? Math.round(this.totalWaitTimeMs / this.totalCompleted) : 0,
      avgExecTimeMs: this.totalCompleted > 0 ? Math.round(this.totalExecTimeMs / this.totalCompleted) : 0,
    };
  }

  public enqueue(submission: Submission): boolean {
    // Check if duplicate submission
    const existing = this.store.getSubmission(submission.id);
    if (existing && existing.status !== 'QUEUED' && existing.status !== 'FAILED') {
      return false;
    }

    this.store.saveSubmission(submission);
    this.queue.push({
      submissionId: submission.id,
      enqueuedAt: Date.now(),
      attempts: 0,
    });
    this.totalQueued++;
    console.log(`[SubmissionQueue] Enqueued submission ${submission.id} (Queue size: ${this.queue.length})`);
    this.processNext();
    return true;
  }

  private async processNext() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.activeJobs.size < this.maxConcurrency && this.queue.length > 0) {
        const job = this.queue.shift();
        if (!job) break;

        this.activeJobs.add(job.submissionId);
        // Process job asynchronously without blocking queue pump
        this.executeJob(job).finally(() => {
          this.activeJobs.delete(job.submissionId);
          this.processNext();
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeJob(job: QueueJob) {
    const submission = this.store.getSubmission(job.submissionId);
    if (!submission) {
      console.warn(`[SubmissionQueue] Job ${job.submissionId} not found in store.`);
      return;
    }

    const waitTime = Date.now() - job.enqueuedAt;
    submission.status = 'PROCESSING';
    this.store.saveSubmission(submission);

    const execStartTime = Date.now();
    const problem = this.store.getProblemById(submission.problemId);

    if (!problem) {
      submission.status = 'FAILED';
      submission.error = 'Associated problem not found';
      this.store.saveSubmission(submission);
      this.totalFailed++;
      return;
    }

    // Determine test suite (RUN: public sample tests only; SUBMIT: public + hidden tests)
    const isRun = submission.type === 'RUN';
    const testCases = isRun
      ? problem.publicTestCases.map((tc) => ({ ...tc, isHidden: false }))
      : [
          ...problem.publicTestCases.map((tc) => ({ ...tc, isHidden: false })),
          ...(problem.hiddenTestCases || []).map((tc) => ({ ...tc, isHidden: true })),
        ];

    const results: TestCaseResult[] = [];
    let passedCount = 0;
    let overallVerdict: Verdict = 'ACCEPTED';
    let hasCompileError = false;

    try {
      // Execute test cases
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = await this.judge0.executeTestCase(
          submission.language,
          submission.code,
          tc,
          problem.cpuLimitSeconds,
          problem.memoryLimitMb,
          i + 1
        );

        results.push(res);

        if (res.passed) {
          passedCount++;
        } else {
          if (overallVerdict === 'ACCEPTED') {
            overallVerdict = res.verdict;
          }
          if (res.verdict === 'COMPILATION_ERROR') {
            hasCompileError = true;
            break; // Stop further tests on compilation error
          }
        }
      }

      const execDuration = Date.now() - execStartTime;
      const totalTests = testCases.length;
      const scoreRatio = totalTests > 0 ? passedCount / totalTests : 0;
      const finalScore = isRun ? 0 : Math.round(problem.points * scoreRatio);

      submission.status = 'COMPLETED';
      submission.overallVerdict = overallVerdict;
      submission.passedTests = passedCount;
      submission.totalTests = totalTests;
      submission.score = finalScore;
      submission.maxScore = isRun ? 0 : problem.points;
      submission.testResults = results;
      submission.completedAt = new Date().toISOString();
      submission.executionDurationMs = execDuration;

      this.store.saveSubmission(submission);

      // If official SUBMIT, update participant aggregate score transactionally
      if (!isRun) {
        updateParticipantScore(
          submission.participantId,
          submission.problemId,
          finalScore,
          passedCount === totalTests,
          submission.id
        );
      }

      this.totalCompleted++;
      this.totalWaitTimeMs += waitTime;
      this.totalExecTimeMs += execDuration;

      console.log(
        `[SubmissionQueue] Finished submission ${submission.id}: verdict=${overallVerdict}, passed=${passedCount}/${totalTests}, score=${finalScore}`
      );
    } catch (err: any) {
      console.error(`[SubmissionQueue] Error processing submission ${submission.id}:`, err.message);

      job.attempts++;
      if (job.attempts < this.maxRetries) {
        // Retry with backoff
        submission.retryCount = job.attempts;
        submission.error = `Retrying (${job.attempts}/${this.maxRetries}): ${err.message}`;
        submission.status = 'QUEUED';
        this.store.saveSubmission(submission);

        setTimeout(() => {
          this.queue.push(job);
          this.processNext();
        }, Math.pow(2, job.attempts) * 1000);
      } else {
        // Exceeded retries - mark permanent failure
        submission.status = 'FAILED';
        submission.error = `Evaluation failed after ${this.maxRetries} attempts: ${err.message}`;
        submission.overallVerdict = 'INTERNAL_ERROR';
        submission.completedAt = new Date().toISOString();
        this.store.saveSubmission(submission);
        this.totalFailed++;
      }
    }
  }
}
