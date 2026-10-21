import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor } from "~/domain/review/types.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import type {
    WorkflowConflictError,
    WorkflowNotFoundError,
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";

export interface StoreWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the caller loaded. Omit when creating a new workflow (D131). */
    savedOn?: string | null;
    /** Who saves; built by the app wrapper (D132, R58). Carried on the workflow events. */
    actor: Actor;
}

export interface IStoreWorkflowUseCaseErrors {
    validation: WorkflowValidationError;
    conflict: WorkflowConflictError;
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IStoreWorkflowUseCaseErrors[keyof IStoreWorkflowUseCaseErrors];

export interface IStoreWorkflowUseCase {
    execute(input: StoreWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Create or update a workflow through one validation path, with an optimistic `savedOn` check
 * on updates. Internal (D132): no permission check; each app's store wrapper checks `editor`.
 * Rule user targets must be members of their step's teams (spec 6, R122): checked with one user
 * lookup per step, run as the system; a failed lookup is `WorkflowPersistenceError`.
 */
export const StoreWorkflowUseCase =
    createAbstraction<IStoreWorkflowUseCase>("StoreWorkflowUseCase");

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
    export type Input = StoreWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
