import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import {
    type WorkflowStateNotFoundError,
    WorkflowStatePersistenceError,
    type WorkflowStateStepCannotReviewError,
    type WorkflowStateStepNotStepOwnerError
} from "~/domain/workflowState/errors.js";
import type { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

export interface IRejectWorkflowStateStepUseCase {
    execute(id: string, comment: string): Promise<Result<WorkflowState, UseCaseError>>;
}

export interface IRejectWorkflowStateStepUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    cannotReview: WorkflowStateStepCannotReviewError;
    notStepOwner: WorkflowStateStepNotStepOwnerError;
    workflowState: WorkflowState.Error;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError =
    IRejectWorkflowStateStepUseCaseErrors[keyof IRejectWorkflowStateStepUseCaseErrors];

export const RejectWorkflowStateStepUseCase = createAbstraction<IRejectWorkflowStateStepUseCase>(
    "RejectWorkflowStateStepUseCase"
);

export namespace RejectWorkflowStateStepUseCase {
    export type Interface = IRejectWorkflowStateStepUseCase;
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}
