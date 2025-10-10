import type { IMeta } from "./types.js";
import type {
    IWorkflowState,
    IWorkflowStateRecord,
    WorkflowStateRecordState
} from "./WorkflowState.js";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";
import type { Topic } from "@webiny/pubsub/types.js";

export interface IWorkflowStateContextListStatesWhere {
    id?: string;
    app?: string;
    app_in?: string[];
    workflowId?: string;
    workflowId_in?: string[];
    targetId?: string;
    targetId_in?: string[];
    targetRevisionId?: string;
    targetRevisionId_in?: string[];
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

export interface IWorkflowStateContextOnStateAfterCreate {
    state: IWorkflowState;
}

export interface IWorkflowStateContextOnStateAfterUpdate {
    state: IWorkflowState;
    original: IWorkflowState;
}

export interface IWorkflowStateContextOnStateAfterDelete {
    state: IWorkflowState;
}

export interface IWorkflowStateContext {
    onStateAfterCreate: Topic<IWorkflowStateContextOnStateAfterCreate>;
    onStateAfterUpdate: Topic<IWorkflowStateContextOnStateAfterUpdate>;
    onStateAfterDelete: Topic<IWorkflowStateContextOnStateAfterDelete>;
    getState(app: string, id: string): Promise<IWorkflowState>;
    listStates(
        params?: IWorkflowStateContextListStatesParams
    ): Promise<IWorkflowStateContextListStatesResponse>;
    createState(app: string, targetRevisionId: string): Promise<IWorkflowState>;
    updateState(
        id: string,
        record: Partial<Omit<IWorkflowStateRecord, "id">>
    ): Promise<IWorkflowState>;
    deleteState(app: string, targetRevisionId: string): Promise<void>;
}
