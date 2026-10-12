import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import type { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";

export interface DeleteCmsEntryWorkflowInput {
    id: string;
}

export interface IDeleteCmsEntryWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    get: GetWorkflowUseCase.Error;
    delete: DeleteWorkflowUseCase.Error;
}

type UseCaseError =
    IDeleteCmsEntryWorkflowUseCaseErrors[keyof IDeleteCmsEntryWorkflowUseCaseErrors];

export interface IDeleteCmsEntryWorkflowUseCase {
    execute(input: DeleteCmsEntryWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Delete a Headless CMS workflow (spec 4.1, D132): needs `workflows.editor`. When reviews are in
 * progress, the error keeps the exact count and lists up to 5 the caller can read (D115, R57).
 */
export const DeleteCmsEntryWorkflowUseCase = createAbstraction<IDeleteCmsEntryWorkflowUseCase>(
    "DeleteCmsEntryWorkflowUseCase"
);

export namespace DeleteCmsEntryWorkflowUseCase {
    export type Interface = IDeleteCmsEntryWorkflowUseCase;
    export type Input = DeleteCmsEntryWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
