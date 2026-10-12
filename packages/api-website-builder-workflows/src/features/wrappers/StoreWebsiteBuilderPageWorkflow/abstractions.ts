import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow, WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";

export interface StoreWebsiteBuilderPageWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the editor loaded; omit when creating (D131). */
    savedOn?: string | null;
}

export interface IStoreWebsiteBuilderPageWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    store: StoreWorkflowUseCase.Error;
}

type UseCaseError =
    IStoreWebsiteBuilderPageWorkflowUseCaseErrors[keyof IStoreWebsiteBuilderPageWorkflowUseCaseErrors];

export interface IStoreWebsiteBuilderPageWorkflowUseCase {
    execute(input: StoreWebsiteBuilderPageWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Create or update a Website Builder pages workflow (spec 4.1, D131, D132): needs
 * `workflows.editor`; models must be `wb.page`; a workflow of another app is never overwritten
 * (R46, R60).
 */
export const StoreWebsiteBuilderPageWorkflowUseCase =
    createAbstraction<IStoreWebsiteBuilderPageWorkflowUseCase>(
        "StoreWebsiteBuilderPageWorkflowUseCase"
    );

export namespace StoreWebsiteBuilderPageWorkflowUseCase {
    export type Interface = IStoreWebsiteBuilderPageWorkflowUseCase;
    export type Input = StoreWebsiteBuilderPageWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
