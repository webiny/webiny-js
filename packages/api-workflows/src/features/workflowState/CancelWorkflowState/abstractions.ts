import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWorkflowState } from "~/domain/workflowState/abstractions.js";
import {
    type WorkflowStateNotFoundError,
    type WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";

/**
 * CancelWorkflowState use case interface - marks workflow state as inactive
 */
export interface ICancelWorkflowStateUseCase {
    execute(id: string): Promise<Result<IWorkflowState, UseCaseError>>;
}

export interface ICancelWorkflowStateUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError = ICancelWorkflowStateUseCaseErrors[keyof ICancelWorkflowStateUseCaseErrors];

export const CancelWorkflowStateUseCase = createAbstraction<ICancelWorkflowStateUseCase>(
    "CancelWorkflowStateUseCase"
);

export namespace CancelWorkflowStateUseCase {
    export type Interface = ICancelWorkflowStateUseCase;
    export type Return = Promise<Result<IWorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}
