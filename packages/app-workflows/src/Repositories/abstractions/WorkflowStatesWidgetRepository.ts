import type { IGenericError, IWorkflowStatesWidgetItem } from "~/types.js";
import { WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatesWidgetRepositoryListResult {
    items: IWorkflowStatesWidgetItem[];
    totalCount: number;
}

export interface IWorkflowStatesWidgetRepository {
    readonly loading: boolean;
    readonly error: IGenericError | null;
    listOwnStates(state: WorkflowStateValue): Promise<IWorkflowStatesWidgetRepositoryListResult>;
    listRequestedStates(
        state: WorkflowStateValue
    ): Promise<IWorkflowStatesWidgetRepositoryListResult>;
}
