import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";

export interface IStuckStepService {
    /**
     * Returns `review` unchanged, or the saved review whose current step was failed because its
     * task ended without writing a result. Never throws.
     */
    check(review: ReviewData): Promise<ReviewData>;
}

/**
 * Stuck detection for single reads (D28, D57, R152, R168): an `inReview` step of any type that
 * carries a task id, whose task is `success`, `failed` / `aborted` for longer than the grace, or
 * gone (null task) for longer than the grace, and that passes the stale guard (R144), is failed
 * with the stuck reason of the runner of its type (`The automation task ended without a result.`
 * for automation), or `The step failed.` when no runner is registered for the type. Called by
 * `GetReviewUseCase` and `GetTargetReviewUseCase` only, never by lists. Internal (D132): no
 * permission checks.
 */
export const StuckStepService = createAbstraction<IStuckStepService>("StuckStepService");

export namespace StuckStepService {
    export type Interface = IStuckStepService;
}
