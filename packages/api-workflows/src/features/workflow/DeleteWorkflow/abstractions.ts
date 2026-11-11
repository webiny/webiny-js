import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor } from "~/domain/review/types.js";
import type { Workflow } from "~/domain/workflow/types.js";
import type {
    WorkflowHasActiveReviewsError,
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

export interface DeleteWorkflowInput {
    id: string;
    /** Who deletes; built by the app wrapper (D132, R58). Carried on the workflow events. */
    actor: Actor;
}

export interface IDeleteWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    hasActiveReviews: WorkflowHasActiveReviewsError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IDeleteWorkflowUseCaseErrors[keyof IDeleteWorkflowUseCaseErrors];

export interface IDeleteWorkflowUseCase {
    execute(input: DeleteWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Delete a workflow unless any of its reviews is in progress. Internal (D132): each app's
 * delete wrapper checks `editor`.
 */
export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Input = DeleteWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
