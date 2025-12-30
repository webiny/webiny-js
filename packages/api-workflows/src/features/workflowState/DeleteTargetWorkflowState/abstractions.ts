import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import {
    type WorkflowStateNotFoundError,
    WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import type { IWorkflowState } from "~/domain/workflowState/abstractions.js";

export interface WorkflowStateAfterDeletePayload {
    state: IWorkflowState;
}

export interface IDeleteTargetWorkflowStateUseCase {
    execute(app: string, targetRevisionId: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteTargetWorkflowStateUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError =
    IDeleteTargetWorkflowStateUseCaseErrors[keyof IDeleteTargetWorkflowStateUseCaseErrors];

export const DeleteTargetWorkflowStateUseCase =
    createAbstraction<IDeleteTargetWorkflowStateUseCase>("DeleteTargetWorkflowStateUseCase");

export namespace DeleteTargetWorkflowStateUseCase {
    export type Interface = IDeleteTargetWorkflowStateUseCase;
    export type Return = Promise<Result<void, UseCaseError>>;
    export type Error = UseCaseError;
}
