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
 * The step types the workflow editor offers, with availability (D130, D133 point 2, R98): needs
 * `workflows.editor`. A static list until phase 5 adds the `StepType` registry; the workflow
 * validator still accepts only "review".
 */
export const ListWorkflowStepTypesUseCase = createAbstraction<IListWorkflowStepTypesUseCase>(
    "ListWorkflowStepTypesUseCase"
);

export namespace ListWorkflowStepTypesUseCase {
    export type Interface = IListWorkflowStepTypesUseCase;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowStepTypeInfo[], UseCaseError>>;
}
