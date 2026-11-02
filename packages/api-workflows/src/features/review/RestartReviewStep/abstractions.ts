import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewStepNotCurrentError,
    ReviewTargetSyncError
} from "~/domain/review/errors.js";

export interface RestartReviewStepInput {
    reviewId: string;
    /** The failed step the caller acted on; fails with `StepNotCurrent` when it is not current (R17). */
    stepId: string;
    /** Who restarts; the wrapper checked `canRestartByPermission` and read access (D132). */
    actor: Actor;
}

export interface IRestartReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
    invalidState: ReviewInvalidStateError;
    stepNotCurrent: ReviewStepNotCurrentError;
    targetSync: ReviewTargetSyncError;
}

type UseCaseError = IRestartReviewStepUseCaseErrors[keyof IRestartReviewStepUseCaseErrors];

export interface IRestartReviewStepUseCase {
    execute(input: RestartReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Restarts a failed step (spec 5.1, D8, D34, D82, R153): the failed attempt moves to `runs`, the
 * step is reached again through the step-reached path (a new task as the requester, never as the
 * restarter, R149) and the review is saved once. A re-reach that cannot start a task leaves the
 * step `failed` with the new reason, never `pending`. Internal (D132): the app wrapper checks
 * `canRestartByPermission` and read access.
 */
export const RestartReviewStepUseCase = createAbstraction<IRestartReviewStepUseCase>(
    "RestartReviewStepUseCase"
);

export namespace RestartReviewStepUseCase {
    export type Interface = IRestartReviewStepUseCase;
    export type Input = RestartReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
