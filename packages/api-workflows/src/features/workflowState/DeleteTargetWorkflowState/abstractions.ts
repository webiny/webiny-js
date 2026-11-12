import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import {
    type WorkflowStateNotAuthorizedError,
    type WorkflowStateNotFoundError,
    WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

export interface WorkflowStateAfterDeletePayload {
    state: WorkflowState;
}

export interface IDeleteTargetWorkflowStateUseCase {
    execute(app: string, targetRevisionId: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteTargetWorkflowStateUseCaseErrors {
    notAuthorized: WorkflowStateNotAuthorizedError;
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
