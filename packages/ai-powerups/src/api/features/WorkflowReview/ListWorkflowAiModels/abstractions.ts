import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";

/** A model the workflow editor can offer on an AI step: its provider has a connection with a key. */
export interface WorkflowAiModelInfo {
    /** The full id a step stores and `Ai` expects: `"<providerId>/<modelId>"`. */
    id: string;
    name: string;
    providerId: string;
    providerName: string;
}

export interface IListWorkflowAiModelsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowAiModelsUseCaseErrors[keyof IListWorkflowAiModelsUseCaseErrors];

export interface IListWorkflowAiModelsUseCase {
    execute(): Promise<Result<WorkflowAiModelInfo[], UseCaseError>>;
}

/**
 * The models a workflow author can pick on an AI step (R169, R176): needs `workflows.editor`. Reads
 * `ConfiguredAiModelsService`, the one source the capability resolver and the save-time check read
 * too. The shared `listAiModels` GraphQL operation calls this.
 */
export const ListWorkflowAiModelsUseCase = createAbstraction<IListWorkflowAiModelsUseCase>(
    "AiPowerUpsListWorkflowAiModelsUseCase"
);

export namespace ListWorkflowAiModelsUseCase {
    export type Interface = IListWorkflowAiModelsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowAiModelInfo[], UseCaseError>>;
}
