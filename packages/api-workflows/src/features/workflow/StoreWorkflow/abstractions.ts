import { createAbstraction, type Result } from "@webiny/feature/api";
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
 * on updates. No permission check in 1a (`editor` is enforced in phase 1b).
 */
export const StoreWorkflowUseCase =
    createAbstraction<IStoreWorkflowUseCase>("StoreWorkflowUseCase");

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
    export type Input = StoreWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
