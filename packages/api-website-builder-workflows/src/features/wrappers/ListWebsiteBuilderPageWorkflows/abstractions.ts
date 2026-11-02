import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface IListWebsiteBuilderPageWorkflowsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListWebsiteBuilderPageWorkflowsUseCaseErrors[keyof IListWebsiteBuilderPageWorkflowsUseCaseErrors];

export interface IListWebsiteBuilderPageWorkflowsUseCase {
    execute(): Promise<Result<Workflow[], UseCaseError>>;
}

/** The pages workflow (at most one in v1, D15), for any signed-in identity (D78, R59). */
export const ListWebsiteBuilderPageWorkflowsUseCase =
    createAbstraction<IListWebsiteBuilderPageWorkflowsUseCase>(
        "ListWebsiteBuilderPageWorkflowsUseCase"
    );

export namespace ListWebsiteBuilderPageWorkflowsUseCase {
    export type Interface = IListWebsiteBuilderPageWorkflowsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow[], UseCaseError>>;
}
