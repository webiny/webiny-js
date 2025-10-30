import type { IGenericError, IWorkflowState } from "~/types.js";
import { WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatesWidgetRepositoryListResult {
    items: IWorkflowState[];
    totalCount: number;
}

export interface IWorkflowStatesWidgetRepositoryApproveStateParams {
    id: string;
    comment?: string;
}

export interface IWorkflowStatesWidgetRepositoryDeclineStateParams {
    id: string;
    comment: string;
}


export interface IWorkflowStatesWidgetRepository {
    readonly loading: boolean;
    readonly error: IGenericError | null;
    listOwnStates(state: WorkflowStateValue): Promise<IWorkflowStatesWidgetRepositoryListResult>;
    listRequestedStates(
        state: WorkflowStateValue
    ): Promise<IWorkflowStatesWidgetRepositoryListResult>;

    approveState(
        params: IWorkflowStatesWidgetRepositoryApproveStateParams
    ): Promise<IWorkflowState | null>;
    declineState(
        params: IWorkflowStatesWidgetRepositoryDeclineStateParams
    ): Promise<IWorkflowState | null>;
}
