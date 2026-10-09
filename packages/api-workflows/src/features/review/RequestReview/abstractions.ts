import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData, ReviewPick } from "~/domain/review/types.js";
import type {
    ReviewAlreadyActiveError,
    ReviewInvalidStateError,
    ReviewPersistenceError,
    ReviewTargetNotFoundError,
    ReviewTargetSyncError,
    ReviewValidationError,
    ReviewWorkflowNotFoundError
} from "~/domain/review/errors.js";

export interface RequestReviewInput {
    /** Namespace id of the target, e.g. "cms.article" (D15). */
    model: string;
    targetId: string;
    targetRevisionId: string;
    /** Reviewer picks per step (D22). Only malformed picks are rejected here (spec 6). */
    picks?: ReviewPick[];
    /** The requester. 1a takes it explicitly; phase 1b checks permissions and identity. */
    actor: Actor;
}

export interface IRequestReviewUseCaseErrors {
    workflowNotFound: ReviewWorkflowNotFoundError;
    alreadyActive: ReviewAlreadyActiveError;
    targetNotFound: ReviewTargetNotFoundError;
    validation: ReviewValidationError;
    invalidState: ReviewInvalidStateError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IRequestReviewUseCaseErrors[keyof IRequestReviewUseCaseErrors];

export interface IRequestReviewUseCase {
    execute(input: RequestReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Start a review of a target revision with the workflow bound to its model (spec 5.1). */
export const RequestReviewUseCase =
    createAbstraction<IRequestReviewUseCase>("RequestReviewUseCase");

export namespace RequestReviewUseCase {
    export type Interface = IRequestReviewUseCase;
    export type Input = RequestReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
