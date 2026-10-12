import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { WorkflowsNotAuthenticatedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";

export interface IListCmsEntryWorkflowsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListCmsEntryWorkflowsUseCaseErrors[keyof IListCmsEntryWorkflowsUseCaseErrors];

export interface IListCmsEntryWorkflowsUseCase {
    execute(): Promise<Result<Workflow[], UseCaseError>>;
}

/**
 * Every Headless CMS workflow, for any signed-in identity (D78). No paging in phase 2: v1 binds one
 * model per workflow, so the list is at most the model count (R59, A23).
 */
export const ListCmsEntryWorkflowsUseCase = createAbstraction<IListCmsEntryWorkflowsUseCase>(
    "ListCmsEntryWorkflowsUseCase"
);

export namespace ListCmsEntryWorkflowsUseCase {
    export type Interface = IListCmsEntryWorkflowsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow[], UseCaseError>>;
}
