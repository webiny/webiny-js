import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";

export interface GetCmsEntryWorkflowInput {
    id: string;
}

export interface IGetCmsEntryWorkflowUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    get: GetWorkflowUseCase.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IGetCmsEntryWorkflowUseCaseErrors[keyof IGetCmsEntryWorkflowUseCaseErrors];

export interface IGetCmsEntryWorkflowUseCase {
    execute(input: GetCmsEntryWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * One Headless CMS workflow, for workflow editors and identities that can read the entries of a
 * model it is bound to; another app's is not found (R46).
 */
export const GetCmsEntryWorkflowUseCase = createAbstraction<IGetCmsEntryWorkflowUseCase>(
    "GetCmsEntryWorkflowUseCase"
);

export namespace GetCmsEntryWorkflowUseCase {
    export type Interface = IGetCmsEntryWorkflowUseCase;
    export type Input = GetCmsEntryWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
