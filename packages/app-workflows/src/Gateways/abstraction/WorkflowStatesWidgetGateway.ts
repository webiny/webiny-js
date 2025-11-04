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

export interface IWorkflowStatesWidgetGatewayStartStateStepParams {
    id: string;
}

export interface IWorkflowStatesWidgetGatewayStartStateStepResponse {
    data: IWorkflowState | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGatewayTakeOverStateStepParams {
    id: string;
}

export interface IWorkflowStatesWidgetGatewayTakeOverStateStepResponse {
    data: IWorkflowState | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGatewayApproveStateStepParams {
    id: string;
    comment?: string;
}

export interface IWorkflowStatesWidgetGatewayApproveStateStepResponse {
    data: IWorkflowState | null;
    error: IWorkflowStatesWidgetError | null;
}

export interface IWorkflowStatesWidgetGatewayRejectStateStepParams {
    id: string;
    comment: string;
}

export interface IWorkflowStatesWidgetGatewayRejectStateStepResponse {
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
    startStateStep(
        params: IWorkflowStatesWidgetGatewayStartStateStepParams
    ): Promise<IWorkflowStatesWidgetGatewayStartStateStepResponse>;
    takeOverStateStep(
        params: IWorkflowStatesWidgetGatewayTakeOverStateStepParams
    ): Promise<IWorkflowStatesWidgetGatewayTakeOverStateStepResponse>;
    approveStateStep(
        params: IWorkflowStatesWidgetGatewayApproveStateStepParams
    ): Promise<IWorkflowStatesWidgetGatewayApproveStateStepResponse>;
    rejectStateStep(
        params: IWorkflowStatesWidgetGatewayRejectStateStepParams
    ): Promise<IWorkflowStatesWidgetGatewayRejectStateStepResponse>;
}
