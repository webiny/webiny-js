import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import {
    type WorkflowStateNotFoundError,
    WorkflowStatePersistenceError,
    type WorkflowStateStepCannotReviewError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import type { IWorkflowState } from "~/domain/workflowState/abstractions.js";

export interface WorkflowStateStartStepPayload {
    state: IWorkflowState;
}

export interface IStartWorkflowStateStepUseCase {
    execute(id: string): Promise<Result<WorkflowState, UseCaseError>>;
}

export interface IStartWorkflowStateStepUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    cannotReview: WorkflowStateStepCannotReviewError;
    workflowState: WorkflowState.Error;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError =
    IStartWorkflowStateStepUseCaseErrors[keyof IStartWorkflowStateStepUseCaseErrors];

export const StartWorkflowStateStepUseCase = createAbstraction<IStartWorkflowStateStepUseCase>(
    "StartWorkflowStateStepUseCase"
);

export namespace StartWorkflowStateStepUseCase {
    export type Interface = IStartWorkflowStateStepUseCase;
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}
