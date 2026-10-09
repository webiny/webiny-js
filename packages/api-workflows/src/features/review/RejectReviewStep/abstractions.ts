import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewNotOwnerError,
    ReviewPersistenceError,
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { ReviewDecisionInput } from "../shared/types.js";

export interface IRejectReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    notOwner: ReviewNotOwnerError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IRejectReviewStepUseCaseErrors[keyof IRejectReviewStepUseCaseErrors];

export interface IRejectReviewStepUseCase {
    execute(input: ReviewDecisionInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** The owner rejects the current step; the review is rejected for this revision (D10). */
export const RejectReviewStepUseCase =
    createAbstraction<IRejectReviewStepUseCase>("RejectReviewStepUseCase");

export namespace RejectReviewStepUseCase {
    export type Interface = IRejectReviewStepUseCase;
    export type Input = ReviewDecisionInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
