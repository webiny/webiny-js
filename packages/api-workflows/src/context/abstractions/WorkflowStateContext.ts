import type { IMeta } from "./types.js";
import type {
    IWorkflowState,
    IWorkflowStateRecord,
    WorkflowStateRecordState
} from "./WorkflowState.js";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";
import type { Topic } from "@webiny/pubsub/types.js";

export interface IWorkflowStateContextListStatesWhere {
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
    savedBy?: string;
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
    getState(id: string): Promise<IWorkflowState>;
    getTargetState(app: string, id: string): Promise<IWorkflowState>;

    listStates(
        params?: IWorkflowStateContextListStatesParams
    ): Promise<IWorkflowStateContextListStatesResponse>;
    createState(app: string, targetRevisionId: string): Promise<IWorkflowState>;
    updateState(
        id: string,
        record: Partial<Omit<IWorkflowStateRecord, "id">>
    ): Promise<IWorkflowState>;
    deleteTargetState(app: string, targetRevisionId: string): Promise<void>;
    deleteState(id: string): Promise<void>;

    startStateStep(id: string): Promise<IWorkflowState>;
    approveStateStep(id: string, comment?: string): Promise<IWorkflowState>;
    rejectStateStep(id: string, comment: string): Promise<IWorkflowState>;
}
