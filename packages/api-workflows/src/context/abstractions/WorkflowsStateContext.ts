import type { IWorkflowState } from "./WorkflowState.js";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowsStateContextListStatesParams {
    limit?: number;
    after?: string;
    sort?: CmsEntryListSort;
    
}



export interface IWorkflowsStateContextListStatesResponse {
    items: IWorkflowState[];
    meta: IWorkflowStateMeta;
}

export interface IWorkflowsStateContext {
    listStates(params: IWorkflowsStateContextListStatesParams): Promise<IWorkflowsStateContextListStatesResponse>;
}
