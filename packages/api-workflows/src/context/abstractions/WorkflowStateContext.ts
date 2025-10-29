import type { IMeta } from "./types.js";
import type {
    IWorkflowState,
    IWorkflowStateModel,
    IWorkflowStateRecord,
    WorkflowStateRecordState
} from "./WorkflowState.js";
import type { CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";
import type { Topic } from "@webiny/pubsub/types.js";

export interface IWorkflowStateContextListStatesWhereStepsTeams {
    id?: string;
    id_in?: string[];
}

export interface IWorkflowStateContextListStatesWhereStepsNotifications {
    id?: string;
    id_in?: string[];
}

export interface IWorkflowStateContextListStatesWhereSteps {
    id?: string;
    id_in?: string[];
    title?: string;
    title_contains?: string;
    color?: string;
    description?: string;
    teams?: IWorkflowStateContextListStatesWhereStepsTeams;
    notifications?: IWorkflowStateContextListStatesWhereStepsNotifications;
    state?: WorkflowStateRecordState;
    state_in?: WorkflowStateRecordState[];
    comment?: string;
    comment_contains?: string;
    savedBy?: string;
    savedBy_in?: string[];
}

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
    createdBy?: string;
    createdBy_not?: string;
    createdBy_in?: string[];
    createdBy_not_in?: string[];
    isActive?: boolean;
    steps?: IWorkflowStateContextListStatesWhereSteps;
}

export interface IWorkflowStateContextListStatesParams {
    limit?: number;
    after?: string;
    sort?: CmsEntryListSort;
    where?: IWorkflowStateContextListStatesWhere;
}

export interface IWorkflowStateContextListStatesResponse {
    items: IWorkflowStateModel[];
    meta: IMeta;
}

export interface IWorkflowStateContextListOwnWorkflowStatesParams {
    where?: {
        state?: WorkflowStateRecordState;
    };
    limit?: number;
}

export interface IWorkflowStateContextListOwnWorkflowStatesResponse {
    items: IWorkflowStateModel[];
    meta: IMeta;
}

export interface IWorkflowStateContextListRequestedWorkflowStatesParams {
    where: {
        state: WorkflowStateRecordState;
    };
    limit: number;
}

export interface IWorkflowStateContextListRequestedWorkflowStatesResponse {
    items: IWorkflowStateModel[];
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
    getState(id: string): Promise<IWorkflowStateModel>;
    getTargetState(app: string, id: string): Promise<IWorkflowStateModel>;
    listStates(
        params?: IWorkflowStateContextListStatesParams
    ): Promise<IWorkflowStateContextListStatesResponse>;
    /**
     * List Workflow States where the current user is an owner of the request.
     */
    listOwnWorkflowStates(
        params: IWorkflowStateContextListOwnWorkflowStatesParams
    ): Promise<IWorkflowStateContextListOwnWorkflowStatesResponse>;
    /**
     * List Workflow States where the current user is one of the reviewers.
     * @param params
     */
    listRequestedWorkflowStates(
        params: IWorkflowStateContextListRequestedWorkflowStatesParams
    ): Promise<IWorkflowStateContextListRequestedWorkflowStatesResponse>;

    createState(app: string, targetRevisionId: string, title: string): Promise<IWorkflowStateModel>;
    updateState(
        id: string,
        record: Partial<Omit<IWorkflowStateRecord, "id">>
    ): Promise<IWorkflowStateModel>;
    deleteTargetState(app: string, targetRevisionId: string): Promise<void>;
    cancelState(id: string): Promise<IWorkflowStateModel>;
    deleteState(id: string): Promise<void>;
    approveStateStep(id: string, comment?: string): Promise<IWorkflowStateModel>;
    rejectStateStep(id: string, comment: string): Promise<IWorkflowStateModel>;
}
