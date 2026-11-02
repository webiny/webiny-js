import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow, WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";

export interface StoreCmsEntryWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the editor loaded; omit when creating (D131). */
    savedOn?: string | null;
}

export interface IStoreCmsEntryWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    store: StoreWorkflowUseCase.Error;
}

type UseCaseError = IStoreCmsEntryWorkflowUseCaseErrors[keyof IStoreCmsEntryWorkflowUseCaseErrors];

export interface IStoreCmsEntryWorkflowUseCase {
    execute(input: StoreCmsEntryWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Create or update a Headless CMS workflow (spec 4.1, D131, D132): needs `workflows.editor`;
 * models must be `cms.<modelId>`; a workflow of another app is never overwritten (R46, R60).
 */
export const StoreCmsEntryWorkflowUseCase = createAbstraction<IStoreCmsEntryWorkflowUseCase>(
    "StoreCmsEntryWorkflowUseCase"
);

export namespace StoreCmsEntryWorkflowUseCase {
    export type Interface = IStoreCmsEntryWorkflowUseCase;
    export type Input = StoreCmsEntryWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
