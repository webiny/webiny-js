import type { StepRunOutcome } from "./types.js";

/** How the background task of a step attempt stands, in workflows' own words (R257). */
export type StepRunTaskStatus = "pending" | "running" | "done" | "failed" | "aborted";

/**
 * What workflows shows about one attempt of an AI or automation step (R257, D161): enough to tell
 * whether it went wrong or ok, and nothing else. Never the task's input, output or logs, and
 * never a raw error (R146): `reason` is the fixed text the review stored.
 */
export interface ReviewStepRunInfo {
    taskId: string;
    status: StepRunTaskStatus;
    startedOn: string | null;
    finishedOn: string | null;
    /** How many times the step's runner ran; the waits for the task id are not counted. */
    iterations: number;
    outcome: StepRunOutcome | null;
    reason: string | null;
}
