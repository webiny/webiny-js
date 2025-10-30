import { type IWorkflowState, WorkflowStateValue } from "~/types.js";
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
    limit: number;
}

export interface IWorkflowStatesWidgetGatewayListRequestedStatesParams {
    where: {
        state: WorkflowStateValue;
    };
    limit: number;
}

export interface IWorkflowStatesWidgetMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}

export interface IWorkflowStatesWidgetGatewayListOwnStatesResponse {
    data: IWorkflowState[] | null;
    meta: IWorkflowStatesWidgetMeta | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGatewayListRequestedStatesResponse {
    data: IWorkflowState[] | null;
    meta: IWorkflowStatesWidgetMeta | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGatewayApproveStateParams {
    id: string;
    comment?: string;
}

export interface IWorkflowStatesWidgetGatewayApproveStateResponse {
    data: IWorkflowState | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGatewayRejectStateParams {
    id: string;
    comment: string;
}

export interface IWorkflowStatesWidgetGatewayRejectStateResponse {
    data: IWorkflowState | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGateway {
    listOwnStates(
        params: IWorkflowStatesWidgetGatewayListOwnStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListOwnStatesResponse>;
    listRequestedStates(
        params: IWorkflowStatesWidgetGatewayListRequestedStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListRequestedStatesResponse>;
    approveState(
        params: IWorkflowStatesWidgetGatewayApproveStateParams
    ): Promise<IWorkflowStatesWidgetGatewayApproveStateResponse>;
    rejectState(
        params: IWorkflowStatesWidgetGatewayRejectStateParams
    ): Promise<IWorkflowStatesWidgetGatewayRejectStateResponse>;
}
