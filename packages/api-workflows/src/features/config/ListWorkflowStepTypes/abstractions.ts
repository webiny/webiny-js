import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowStepTypeInfo } from "~/domain/config/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "~/domain/permissions/errors.js";

export interface IListWorkflowStepTypesUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowStepTypesUseCaseErrors[keyof IListWorkflowStepTypesUseCaseErrors];

export interface IListWorkflowStepTypesUseCase {
    execute(): Promise<Result<WorkflowStepTypeInfo[], UseCaseError>>;
}

/**
 * The step types the workflow editor offers, with availability (D130, D133 point 2, R98, R138):
 * needs `workflows.editor`. Built from the step type registry; while no `ai` type is registered
 * the `ai` row stays, available with the `aiPowerups` flag (R132).
 */
export const ListWorkflowStepTypesUseCase = createAbstraction<IListWorkflowStepTypesUseCase>(
    "ListWorkflowStepTypesUseCase"
);

export namespace ListWorkflowStepTypesUseCase {
    export type Interface = IListWorkflowStepTypesUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowStepTypeInfo[], UseCaseError>>;
}
