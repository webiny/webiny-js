import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import {
    type WorkflowStateNotFoundError,
    WorkflowStatePersistenceError,
    type WorkflowStateStepCannotReviewError,
    type WorkflowStateStepCannotTakeOverError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

export interface WorkflowStateTakeOverStepPayload {
    state: WorkflowState;
}

export interface ITakeOverWorkflowStateStepUseCase {
    execute(id: string): Promise<Result<WorkflowState, UseCaseError>>;
}

export interface ITakeOverWorkflowStateStepUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    cannotReview: WorkflowStateStepCannotReviewError;
    cannotTakeOver: WorkflowStateStepCannotTakeOverError;
    workflowState: WorkflowState.Error;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError =
    ITakeOverWorkflowStateStepUseCaseErrors[keyof ITakeOverWorkflowStateStepUseCaseErrors];

export const TakeOverWorkflowStateStepUseCase =
    createAbstraction<ITakeOverWorkflowStateStepUseCase>("TakeOverWorkflowStateStepUseCase");

export namespace TakeOverWorkflowStateStepUseCase {
    export type Interface = ITakeOverWorkflowStateStepUseCase;
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}
