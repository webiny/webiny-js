import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import {
    type WorkflowStateNotFoundError,
    type WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import type { IWorkflowState } from "~/domain/workflowState/abstractions.js";

export interface WorkflowStateCancelPayload {
    state: IWorkflowState;
}

/**
 * CancelWorkflowState use case interface - marks workflow state as inactive
 */
export interface ICancelWorkflowStateUseCase {
    execute(id: string): Promise<Result<WorkflowState, UseCaseError>>;
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
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}
