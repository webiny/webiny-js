import type { IWorkflowState } from "~/types.js";
import type { IWorkflowStateError } from "~/Gateways/abstraction/WorkflowStateGateway.js";

export interface IWorkflowStatePresenterViewModel {
    id: string;
    app: string;
    loading: boolean;
    error: IWorkflowStateError | null;
    state: IWorkflowState | null | undefined;
}

export interface IWorkflowStatePresenter {
    vm: IWorkflowStatePresenterViewModel;
    requestReview(): void;
}
