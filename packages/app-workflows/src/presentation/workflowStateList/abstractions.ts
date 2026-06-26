import { createAbstraction } from "@webiny/feature/admin";
import type { IGenericError, IWorkflowState, WorkflowStateValue } from "~/types.js";
import type { ListWorkflowStatesVariant } from "~/features/listWorkflowStates/abstractions.js";

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

export type WorkflowStateListType = ListWorkflowStatesVariant;

export interface IWorkflowStateListPresenterViewModel {
    items: IWorkflowState[];
    loading: boolean;
    error: IGenericError | null;
    totalCount: number;
    hasMoreItems: boolean;
    where: IWorkflowStateListPresenterListParamsWhere;
    type: WorkflowStateListType;
}

export interface IWorkflowStateListPresenter {
    vm: IWorkflowStateListPresenterViewModel;
    list(params?: IWorkflowStateListPresenterListParams): Promise<void>;
    nextPage(): Promise<void>;
    filterBy(where: IWorkflowStateListPresenterListParamsWhere): Promise<void>;
    setType(type: WorkflowStateListType): Promise<void>;
}

export const WorkflowStateListPresenter = createAbstraction<IWorkflowStateListPresenter>(
    "WorkflowStateListPresenter"
);

export namespace WorkflowStateListPresenter {
    export type Interface = IWorkflowStateListPresenter;
    export type ViewModel = IWorkflowStateListPresenterViewModel;
}
