import type { IGenericError, IGenericMeta, IWorkflowState, WorkflowStateValue } from "~/types.js";

export interface IWorkflowStateListGatewayListParamsWhereSteps {
    id?: string;
    id_in?: string[];
    state?: WorkflowStateValue;
    state_in?: WorkflowStateValue[];
    savedBy?: string;
    savedBy_in?: string[];
}

export interface IWorkflowStateListGatewayListParamsWhereTeams {
    id?: string;
    id_in?: string[];
}

export interface IWorkflowStateListGatewayListParamsWhereNotifications {
    id?: string;
    id_in?: string[];
}

export interface IWorkflowStateListGatewayListParamsWhere {
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
    steps?: IWorkflowStateListGatewayListParamsWhereSteps;
    teams?: IWorkflowStateListGatewayListParamsWhereTeams;
    notifications?: IWorkflowStateListGatewayListParamsWhereNotifications;
}

export interface IWorkflowStateListGatewayListParams {
    where?: IWorkflowStateListGatewayListParamsWhere;
    sort?: ["createdOn_ASC" | "createdOn_DESC"];
    limit?: number;
    after?: string;
}

export interface IWorkflowStateListGatewayListResponse {
    data: IWorkflowState[] | null;
    meta: IGenericMeta | null;
    error: IGenericError | null;
}

export interface IWorkflowStateListGateway {
    list(
        params?: IWorkflowStateListGatewayListParams
    ): Promise<IWorkflowStateListGatewayListResponse>;
}
