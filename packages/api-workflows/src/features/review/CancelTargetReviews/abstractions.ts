import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";
import type { CancelReviewUseCase } from "../CancelReview/abstractions.js";

export interface CancelTargetReviewsInput {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    /** Only this revision's review; every revision of the target when omitted. */
    targetRevisionId?: string | null;
    /** The user trashing or deleting the content (D134). */
    actor: Actor;
    /** Recorded on each cancelled event, e.g. "content trashed". */
    reason: string;
}

export interface ICancelTargetReviewsUseCaseErrors {
    persistence: ReviewPersistenceError;
    cancel: CancelReviewUseCase.Error;
}

type UseCaseError = ICancelTargetReviewsUseCaseErrors[keyof ICancelTargetReviewsUseCaseErrors];

export interface ICancelTargetReviewsUseCase {
    execute(input: CancelTargetReviewsInput): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * Cancels every in-progress review of a target (or of one revision) before the content is trashed
 * or deleted (D134). Internal (D132): the app's cancel-for-delete wrapper checks that the caller
 * may delete the content; no cancel permission is needed.
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
