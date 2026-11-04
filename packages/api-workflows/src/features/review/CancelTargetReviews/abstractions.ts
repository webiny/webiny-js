import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type { CancelReviewUseCase } from "../CancelReview/abstractions.js";

export interface CancelTargetReviewsInput {
    /**
     * The target's reviews, as the caller listed them (it lists them to check access, so the
     * engine does not list them again). Only the in-progress ones are cancelled.
     */
    reviews: ReviewData[];
    /** The user trashing or deleting the content (D134). */
    actor: Actor;
    /** Recorded on each cancelled event, e.g. "content trashed". */
    reason: string;
}

export interface ICancelTargetReviewsUseCaseErrors {
    cancel: CancelReviewUseCase.Error;
}

type UseCaseError = ICancelTargetReviewsUseCaseErrors[keyof ICancelTargetReviewsUseCaseErrors];

export interface ICancelTargetReviewsUseCase {
    execute(input: CancelTargetReviewsInput): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * Cancels the given in-progress reviews of a target (or of one revision) before the content is
 * trashed or deleted (D134). Internal (D132): the app's cancel-for-delete wrapper lists the
 * reviews and checks that the caller may delete the content; no cancel permission is needed.
 */
export const CancelTargetReviewsUseCase = createAbstraction<ICancelTargetReviewsUseCase>(
    "CancelTargetReviewsUseCase"
);

export namespace CancelTargetReviewsUseCase {
    export type Interface = ICancelTargetReviewsUseCase;
    export type Input = CancelTargetReviewsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
