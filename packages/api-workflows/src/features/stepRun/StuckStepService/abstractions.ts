import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";

export interface IStuckStepService {
    /**
     * Returns `review` unchanged, or the saved review whose current automation step was failed
     * because its task ended without writing a result. Never throws.
     */
    check(review: ReviewData): Promise<ReviewData>;
}

/**
 * Stuck detection for single reads (D28, D57, R152): an `inReview` automation step whose task is
 * `success`, `failed` / `aborted` for longer than the grace, or gone (null task) for longer than the grace, and that passes the stale guard (R144), is failed with
 * `The automation task ended without a result.`. Called by `GetReviewUseCase` and
 * `GetTargetReviewUseCase` only, never by lists. Internal (D132): no permission checks.
 */
export const StuckStepService = createAbstraction<IStuckStepService>("StuckStepService");

export namespace StuckStepService {
    export type Interface = IStuckStepService;
}
