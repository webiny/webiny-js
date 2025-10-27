import type { IGenericError, IWorkflowStatesWidgetItem } from "~/types.js";
import { WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatesWidgetRepository {
    readonly loading: boolean;
    readonly error: IGenericError | null;
    listOwnStates(state: WorkflowStateValue): Promise<IWorkflowStatesWidgetItem[]>;
    listRequestedStates(state: WorkflowStateValue): Promise<IWorkflowStatesWidgetItem[]>;
}
