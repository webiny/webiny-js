import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewActorNotUserError,
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
    ReviewStepNotTakeableError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { ReviewActorInput } from "../shared/types.js";

export interface ITakeOverReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    actorNotUser: ReviewActorNotUserError;
    requesterCannotReview: ReviewRequesterCannotReviewError;
    notCandidate: ReviewNotCandidateError;
    alreadyOwner: ReviewAlreadyOwnerError;
    stepNotTakeable: ReviewStepNotTakeableError;
    persistence: ReviewPersistenceError;
    targetSync: ReviewTargetSyncError;
}

export interface TakeOverReviewStepInput extends ReviewActorInput {
    /** D111: whether the previous owner is told; omitted means true. Reaches the fact, never stored. */
    notifyPreviousOwner?: boolean;
}

type UseCaseError = ITakeOverReviewStepUseCaseErrors[keyof ITakeOverReviewStepUseCaseErrors];

export interface ITakeOverReviewStepUseCase {
    execute(input: TakeOverReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Another candidate takes a human step in review (spec 5.1 "take over", D32, D9). */
export const TakeOverReviewStepUseCase = createAbstraction<ITakeOverReviewStepUseCase>(
    "TakeOverReviewStepUseCase"
);

export namespace TakeOverReviewStepUseCase {
    export type Interface = ITakeOverReviewStepUseCase;
    export type Input = TakeOverReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
