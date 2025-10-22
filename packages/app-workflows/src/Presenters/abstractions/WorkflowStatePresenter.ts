import type { IWorkflow, IWorkflowState } from "~/types.js";
import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";
import type { IWorkflowStateStepModel } from "~/Models/index.js";

export interface IWorkflowStatePresenterViewModel {
    id: string;
    app: string;
    loading: boolean;
    workflow: IWorkflow | null;
    error: IWorkflowStateError | null;
    state: IWorkflowState | null | undefined;
    step: IWorkflowStateStepModel | null;
    nextStep: IWorkflowStateStepModel | null;
    canStartStepReview: boolean;
    canCancel: boolean;
    canReview: boolean;
    showApproveDialog: boolean;
    showRejectDialog: boolean;
}

export interface IWorkflowStatePresenter {
    vm: IWorkflowStatePresenterViewModel;
    requestReview(): void;
    start(): void;
    approve(comment?: string): void;
    reject(comment: string): void;
    cancel(): void;
    showApproveDialog(): void;
    hideDialog(): void;
    showRejectDialog(): void;
}
