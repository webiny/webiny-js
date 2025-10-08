import type { IMeta } from "./types.js";
import type { IWorkflowState, IWorkflowStateRecord, WorkflowStateRecordState } from "./WorkflowState.js";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowStateContextListStatesWhere {
    id?: string;
    app?: string;
    app_in?: string[];
    workflowId?: string;
    workflowId_in?: string[];
    targetId?: string;
    targetId_in?: string[];
    state?: WorkflowStateRecordState;
    state_in?: WorkflowStateRecordState[];
}

export interface IWorkflowStateContextListStatesParams {
    limit?: number;
    after?: string;
    sort?: CmsEntryListSort;
    where?: IWorkflowStateContextListStatesWhere;
}

export interface IWorkflowStateContextListStatesResponse {
    items: IWorkflowState[];
    meta: IMeta;
}

export interface IWorkflowStateContext {
    getState(
        app: string,
        id: string
    ): Promise<IWorkflowState>;
    listStates(
        params?: IWorkflowStateContextListStatesParams
    ): Promise<IWorkflowStateContextListStatesResponse>;
    updateState(id: string, record: IWorkflowStateRecord): Promise<void>;
}
