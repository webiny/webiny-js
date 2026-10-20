import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AutomationDefinitionInfo } from "~/domain/config/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListAutomationDefinitionsUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError =
    IListAutomationDefinitionsUseCaseErrors[keyof IListAutomationDefinitionsUseCaseErrors];

export interface IListAutomationDefinitionsUseCase {
    execute(): Promise<Result<AutomationDefinitionInfo[], UseCaseError>>;
}

/**
 * The automations a workflow author can add as a step, with the JSON schema of each one's
 * settings (spec 7.2, D133 point 2, R138): needs `workflows.editor`. Sorted by name. The shared
 * `listAutomationDefinitions` GraphQL operation calls this.
 */
export const ListAutomationDefinitionsUseCase =
    createAbstraction<IListAutomationDefinitionsUseCase>("ListAutomationDefinitionsUseCase");

export namespace ListAutomationDefinitionsUseCase {
    export type Interface = IListAutomationDefinitionsUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<AutomationDefinitionInfo[], UseCaseError>>;
}
