import { createAbstraction } from "@webiny/feature/admin";
import type { IGenericMeta, IWorkflowState, WorkflowStateValue } from "~/types.js";

export interface IListWorkflowStatesWhereSteps {
    id?: string;
    id_in?: string[];
    state?: WorkflowStateValue;
    state_in?: WorkflowStateValue[];
    savedBy?: string;
    savedBy_in?: string[];
}

export interface IListWorkflowStatesWhereTeams {
    id?: string;
    id_in?: string[];
}

export interface IListWorkflowStatesWhereNotifications {
    id?: string;
    id_in?: string[];
}

export interface IListWorkflowStatesWhere {
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
    isActive?: boolean;
    steps?: IListWorkflowStatesWhereSteps;
    teams?: IListWorkflowStatesWhereTeams;
    notifications?: IListWorkflowStatesWhereNotifications;
}

export interface IListWorkflowStatesParams {
    where?: IListWorkflowStatesWhere;
    sort?: ["createdOn_ASC" | "createdOn_DESC"];
    limit?: number;
    after?: string;
}

export interface IListWorkflowStatesResult {
    data: IWorkflowState[];
    meta: IGenericMeta | null;
}

export type ListWorkflowStatesVariant = "all" | "own" | "requested";

export interface IListWorkflowStatesGateway {
    execute(
        params?: IListWorkflowStatesParams,
        variant?: ListWorkflowStatesVariant
    ): Promise<IListWorkflowStatesResult>;
}

export const ListWorkflowStatesGateway = createAbstraction<IListWorkflowStatesGateway>(
    "ListWorkflowStatesGateway"
);

export namespace ListWorkflowStatesGateway {
    export type Interface = IListWorkflowStatesGateway;
}

export interface IListWorkflowStatesUseCase {
    execute(
        params?: IListWorkflowStatesParams,
        variant?: ListWorkflowStatesVariant
    ): Promise<IListWorkflowStatesResult>;
}

export const ListWorkflowStatesUseCase = createAbstraction<IListWorkflowStatesUseCase>(
    "ListWorkflowStatesUseCase"
);

export namespace ListWorkflowStatesUseCase {
    export type Interface = IListWorkflowStatesUseCase;
}
