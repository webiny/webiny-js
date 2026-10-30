import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type {
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewReassignTargetInvalidError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotCurrentError,
    ReviewStepNotReassignableError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";

export interface ReassignReviewStepInput {
    reviewId: string;
    /** The step the caller acted on; fails with `StepNotCurrent` when it is not current (R17). */
    stepId: string;
    /** The chosen user; validated like a pick (R112). */
    userId: string;
    /** Who reassigns; the wrapper checked `workflows.reassign` and read access (D132). */
    actor: Actor;
}

export interface IReassignReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    stepNotReassignable: ReviewStepNotReassignableError;
    alreadyOwner: ReviewAlreadyOwnerError;
    targetInvalid: ReviewReassignTargetInvalidError;
    requesterCannotReview: ReviewRequesterCannotReviewError;
    routing: RoutingDependencyError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IReassignReviewStepUseCaseErrors[keyof IReassignReviewStepUseCaseErrors];

export interface IReassignReviewStepUseCase {
    execute(input: ReassignReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Gives an `awaiting` or human-held step to a chosen user (spec 5.1 "reassign", D33, R119).
 * Internal (D132): the app wrapper checks `workflows.reassign` and read access. The engine checks
 * the chosen user like a pick (R112): not the requester, a member of the step's candidate teams,
 * not excluded, can read the target.
 */
export const ReassignReviewStepUseCase = createAbstraction<IReassignReviewStepUseCase>(
    "ReassignReviewStepUseCase"
);

export namespace ReassignReviewStepUseCase {
    export type Interface = IReassignReviewStepUseCase;
    export type Input = ReassignReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
