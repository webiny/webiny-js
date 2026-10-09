import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewActorNotUserError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { ReviewActorInput } from "../shared/types.js";

export interface IStartReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    actorNotUser: ReviewActorNotUserError;
    requesterCannotReview: ReviewRequesterCannotReviewError;
    notCandidate: ReviewNotCandidateError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IStartReviewStepUseCaseErrors[keyof IStartReviewStepUseCaseErrors];

export interface IStartReviewStepUseCase {
    execute(input: ReviewActorInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** A candidate takes an awaiting step from the pool (spec 5.1 "start"). */
export const StartReviewStepUseCase =
    createAbstraction<IStartReviewStepUseCase>("StartReviewStepUseCase");

export namespace StartReviewStepUseCase {
    export type Interface = IStartReviewStepUseCase;
    export type Input = ReviewActorInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
