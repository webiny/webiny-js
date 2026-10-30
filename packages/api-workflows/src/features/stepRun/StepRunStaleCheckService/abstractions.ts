import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";

export interface StepRunStaleCheckParams {
    reviewId: string;
    stepId: string;
    /** The task's own identity, never values read from the task input (R148). */
    task: StepRunTaskIdentity;
}

export interface IStepRunStaleCheckService {
    /**
     * `ok(true)` when this task must no longer write to the review (R144, R175): the review is
     * gone, cancelled or finished, or the step was restarted under another task. One repository
     * read per call; no throttle and no state, the caller owns both. Fail-closed: a failed or
     * throwing read is logged here (callers do not log it again) and answered with a failed
     * Result, never with `ok(false)`, so a caller about to write can refuse. Never throws.
     */
    isStale(params: StepRunStaleCheckParams): Promise<Result<boolean, ReviewPersistenceError>>;
}

/**
 * Re-reads the stored review and applies the stale guard, for a runner whose call outlives the
 * moment it started (the AI runner): `controller.runtime.isAborted()` only sees the task loaded at
 * run start (R175). Internal (D132): no permission checks.
 */
export const StepRunStaleCheckService = createAbstraction<IStepRunStaleCheckService>(
    "StepRunStaleCheckService"
);

export namespace StepRunStaleCheckService {
    export type Interface = IStepRunStaleCheckService;
    export type Params = StepRunStaleCheckParams;
}
