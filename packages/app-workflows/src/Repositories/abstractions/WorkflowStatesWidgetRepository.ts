import type { IGenericError, IWorkflowState } from "~/types.js";
import { WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatesWidgetRepositoryListResult {
    items: IWorkflowState[];
    totalCount: number;
}

export interface IWorkflowStatesWidgetRepositoryStartStateStepParams {
    id: string;
}

export interface IWorkflowStatesWidgetRepositoryApproveStateStepParams {
    id: string;
    comment?: string;
}

export interface IWorkflowStatesWidgetRepositoryRejectStateStepParams {
    id: string;
    comment: string;
}

export interface IWorkflowStatesWidgetRepository {
    readonly loading: boolean;
    readonly error: IGenericError | null;
    readonly actionLoading: boolean;
    readonly actionError: IGenericError | null;
    listOwnStates(state: WorkflowStateValue): Promise<IWorkflowStatesWidgetRepositoryListResult>;
    listRequestedStates(
        state: WorkflowStateValue
    ): Promise<IWorkflowStatesWidgetRepositoryListResult>;
    startStateStep(
        params: IWorkflowStatesWidgetRepositoryStartStateStepParams
    ): Promise<IWorkflowState | null>;
    approveStateStep(
        params: IWorkflowStatesWidgetRepositoryApproveStateStepParams
    ): Promise<IWorkflowState | null>;
    rejectStateStep(
        params: IWorkflowStatesWidgetRepositoryRejectStateStepParams
    ): Promise<IWorkflowState | null>;
}
