import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import type { ReviewInvalidStateError, ReviewStepNotCurrentError } from "~/domain/review/errors.js";

/** What `StepType.reach` and `Review.fail` / `Review.reachRun` can return (R159). */
export type ReviewStepReacherError = ReviewInvalidStateError | ReviewStepNotCurrentError;

export interface ReviewStepReacherParams {
    review: Review;
    /** Who caused the step to be reached (requester, or approver of the previous step). */
    actor: Actor;
    now: string;
}

export interface IReviewStepReacher {
    reach(params: ReviewStepReacherParams): Promise<Result<void, ReviewStepReacherError>>;
}

/**
 * The one code path for "step reached" (spec 5.2, D2, D6). No-op when the current step is not
 * pending. Dispatches by step type through `StepTypeRegistryService` (R131): the `review` type
 * resolves an assignment, the `automation` type triggers its background task (R149); a step whose
 * type is not registered is failed with a reason. A failed step is not an error of the reach; an
 * error of `reach`, `reachRun` or `fail` is returned as it is (R159).
 */
export const ReviewStepReacher = createAbstraction<IReviewStepReacher>("ReviewStepReacher");

export namespace ReviewStepReacher {
    export type Interface = IReviewStepReacher;
    export type Params = ReviewStepReacherParams;
    export type Error = ReviewStepReacherError;
}
