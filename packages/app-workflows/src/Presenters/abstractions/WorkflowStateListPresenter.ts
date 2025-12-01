import type { IGenericError, IWorkflowState, WorkflowStateValue } from "~/types.js";
import type { WorkflowStateListRepositoryType } from "~/Repositories/index.js";

export interface IWorkflowStateListPresenterViewModel {
    items: IWorkflowState[];
    loading: boolean;
    error: IGenericError | null;
    totalCount: number;
    hasMoreItems: boolean;
    where: IWorkflowStateListPresenterListParamsWhere;
    type: WorkflowStateListRepositoryType;
}

export interface IWorkflowStateListPresenterListParamsWhereSteps {
    id?: string;
    id_in?: string[];
    state?: WorkflowStateValue;
    state_in?: WorkflowStateValue[];
    savedBy?: string;
    savedBy_in?: string[];
}

export interface IWorkflowStateListPresenterListParamsWhereTeams {
    id?: string;
    id_in?: string[];
}

export interface IWorkflowStateListPresenterListParamsWhereNotifications {
    id?: string;
    id_in?: string[];
}

export interface IWorkflowStateListPresenterListParamsWhere {
    app?: string;
    app_in?: string[];
    targetId?: string;
    targetId_in?: string[];
    targetRevisionId?: string;
    targetRevisionId_in?: string[];
    state?: WorkflowStateValue;
    state_in?: WorkflowStateValue[];
    createdBy?: string;
    createdBy_in?: string[];
    savedBy?: string;
    savedBy_in?: string[];
    steps?: IWorkflowStateListPresenterListParamsWhereSteps;
    teams?: IWorkflowStateListPresenterListParamsWhereTeams;
    notifications?: IWorkflowStateListPresenterListParamsWhereNotifications;
    isActive?: boolean;
}

export interface IWorkflowStateListPresenterListParams {
    where?: IWorkflowStateListPresenterListParamsWhere;
    sort?: ["createdOn_ASC" | "createdOn_DESC"];
    limit?: number;
    after?: string;
}

export interface IWorkflowStateListPresenter {
    vm: IWorkflowStateListPresenterViewModel;

    nextPage(): Promise<void>;
    filterBy(where: IWorkflowStateListPresenterListParamsWhere): Promise<void>;
    list(params?: IWorkflowStateListPresenterListParams): Promise<void>;
    setType(type: WorkflowStateListRepositoryType): Promise<void>;
}
