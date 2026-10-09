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

export interface IApproveReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    notOwner: ReviewNotOwnerError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IApproveReviewStepUseCaseErrors[keyof IApproveReviewStepUseCaseErrors];

export interface IApproveReviewStepUseCase {
    execute(input: ReviewDecisionInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** The owner approves the current step; the next step is reached, or the review is approved. */
export const ApproveReviewStepUseCase = createAbstraction<IApproveReviewStepUseCase>(
    "ApproveReviewStepUseCase"
);

export namespace ApproveReviewStepUseCase {
    export type Interface = IApproveReviewStepUseCase;
    export type Input = ReviewDecisionInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
