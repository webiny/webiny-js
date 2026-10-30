import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowAiToolInfo } from "~/domain/config/types.js";
import type { WorkflowLookupError } from "~/domain/workflow/errors.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListWorkflowAiToolsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
    lookup: WorkflowLookupError;
}

type UseCaseError = IListWorkflowAiToolsUseCaseErrors[keyof IListWorkflowAiToolsUseCaseErrors];

export interface IListWorkflowAiToolsUseCase {
    execute(): Promise<Result<WorkflowAiToolInfo[], UseCaseError>>;
}

/**
 * The AI tools a workflow author can allowlist on an AI step (spec 9.3, R167): needs
 * `workflows.editor`. Sorted by title. The shared `listAiTools` GraphQL operation calls this.
 */
export const ListWorkflowAiToolsUseCase = createAbstraction<IListWorkflowAiToolsUseCase>(
    "ListWorkflowAiToolsUseCase"
);

export namespace ListWorkflowAiToolsUseCase {
    export type Interface = IListWorkflowAiToolsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowAiToolInfo[], UseCaseError>>;
}
