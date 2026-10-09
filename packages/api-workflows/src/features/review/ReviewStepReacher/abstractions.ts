import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import type { ReviewInvalidStateError } from "~/domain/review/errors.js";

export interface ReviewStepReacherParams {
    review: Review;
    /** Who caused the step to be reached (requester, or approver of the previous step). */
    actor: Actor;
    now: string;
}

export interface IReviewStepReacher {
    reach(params: ReviewStepReacherParams): Promise<Result<void, ReviewInvalidStateError>>;
}

/**
 * The one code path for "step reached" (spec 5.2, D2, D6). No-op when the current step is not
 * pending. Phase 5 dispatches here by step type.
 */
export const ReviewStepReacher = createAbstraction<IReviewStepReacher>("ReviewStepReacher");

export namespace ReviewStepReacher {
    export type Interface = IReviewStepReacher;
    export type Params = ReviewStepReacherParams;
}
