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

export interface IApproveWorkflowStateStepUseCase {
    execute(id: string, comment?: string): Promise<Result<WorkflowState, UseCaseError>>;
}

export interface IApproveWorkflowStateStepUseCaseErrors {
    notFound: WorkflowStateNotFoundError;
    workflowNotFound: WorkflowNotFoundError;
    cannotReview: WorkflowStateStepCannotReviewError;
    notStepOwner: WorkflowStateStepNotStepOwnerError;
    workflowState: WorkflowState.Error;
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError =
    IApproveWorkflowStateStepUseCaseErrors[keyof IApproveWorkflowStateStepUseCaseErrors];

export const ApproveWorkflowStateStepUseCase = createAbstraction<IApproveWorkflowStateStepUseCase>(
    "ApproveWorkflowStateStepUseCase"
);

export namespace ApproveWorkflowStateStepUseCase {
    export type Interface = IApproveWorkflowStateStepUseCase;
    export type Return = Promise<Result<WorkflowState, UseCaseError>>;
    export type Error = UseCaseError;
}
