import { type IWorkflowStatesWidgetItem, WorkflowStateValue } from "~/types.js";
import type { IWorkflowStateErrorData } from "~/Gateways/index.js";

export interface IWorkflowStatesWidgetError {
    code: string | null;
    message: string;
    data?: IWorkflowStateErrorData;
    stack?: string;
}

export interface IWorkflowStatesWidgetGatewayListOwnStatesParams {
    where: {
        state: WorkflowStateValue;
    };
}

export interface IWorkflowStatesWidgetGatewayListRequestedStatesParams {
    where: {
        state: WorkflowStateValue;
    };
}

export interface IWorkflowStatesWidgetMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}

export interface IWorkflowStatesWidgetGatewayListOwnStatesResponse {
    data: IWorkflowStatesWidgetItem[] | null;
    meta: IWorkflowStatesWidgetMeta | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGatewayListRequestedStatesResponse {
    data: IWorkflowStatesWidgetItem[] | null;
    meta: IWorkflowStatesWidgetMeta | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGateway {
    listOwnStates(
        params: IWorkflowStatesWidgetGatewayListOwnStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListOwnStatesResponse>;
    listRequestedStates(
        params: IWorkflowStatesWidgetGatewayListRequestedStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListRequestedStatesResponse>;
}
