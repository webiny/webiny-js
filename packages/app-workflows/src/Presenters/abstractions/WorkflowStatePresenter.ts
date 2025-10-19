import type { IWorkflowState } from "~/types.js";
import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";
import type { IWorkflowStateStepModel } from "~/Models/index.js";


export interface IWorkflowStatePresenterViewModel {
    id: string;
    app: string;
    loading: boolean;
    error: IWorkflowStateError | null;
    state: IWorkflowState | null | undefined;
    step: IWorkflowStateStepModel | null;
    isOwner: boolean;
}

export interface IWorkflowStatePresenter {
    vm: IWorkflowStatePresenterViewModel;
    requestReview(): void;
    approve(comment?: string): void;
    reject(comment: string): void;
    cancel(): void;
}
