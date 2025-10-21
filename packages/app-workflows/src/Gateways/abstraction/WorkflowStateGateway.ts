import type { IWorkflowState } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

export interface IWorkflowStateErrorDataInvalidFieldData {
    path: NonEmptyArray<string>;
}

export interface IWorkflowStateErrorDataInvalidField {
    code: string;
    message: string;
    data: IWorkflowStateErrorDataInvalidFieldData;
}

export interface IWorkflowStateErrorDataInvalidFields {
    [key: string]: IWorkflowStateErrorDataInvalidField;
}

export interface IWorkflowStateErrorData {
    invalidFields: IWorkflowStateErrorDataInvalidFields;
}

export interface IWorkflowStateError {
    code: string | null;
    message: string;
    data?: IWorkflowStateErrorData;
    stack?: string;
}

export interface IWorkflowStateGatewayListWorkflowStatesParams {
    where?: {
        app?: string;
        targetRevisionId?: string;
    };
    limit?: number;
    after?: string;
}

export interface IWorkflowStateGatewayListWorkflowStatesResponse {
    data: IWorkflowState[] | null;
    error: IWorkflowStateError | null;
}

export interface IWorkflowStateGatewayApproveStepResponse {
    data: IWorkflowState | null;
    error: IWorkflowStateError | null;
}

export interface IWorkflowStateGatewayRejectStepResponse {
    data: IWorkflowState | null;
    error: IWorkflowStateError | null;
}

export interface IWorkflowStateGatewayCancelStateResponse {
    data: boolean | null;
    error: IWorkflowStateError | null;
}

export interface IWorkflowStateGatewayStartStepParams {
    id: string;
}

export interface IWorkflowStateGatewayStartStepResponse {
    data: IWorkflowState | null;
    error: IWorkflowStateError | null;
}

export interface IWorkflowStateGatewayApproveStepParams {
    id: string;
    comment?: string;
}

export interface IWorkflowStateGatewayRejectStepParams {
    id: string;
    comment: string;
}

export interface IWorkflowStateGatewayRequestReviewStepParams {
    app: string;
    targetRevisionId: string;
}

export interface IWorkflowStateGatewayRequestReviewStepResponse {
    data: IWorkflowState | null;
    error: IWorkflowStateError | null;
}

export interface IWorkflowStateGatewayGetTargetWorkflowStateResponse {
    data: IWorkflowState | null;
    error: IWorkflowStateError | null;
}

export interface IWorkflowStateGateway {
    createWorkflowState(
        params: IWorkflowStateGatewayRequestReviewStepParams
    ): Promise<IWorkflowStateGatewayRequestReviewStepResponse>;
    startWorkflowStateStep(
        params: IWorkflowStateGatewayStartStepParams
    ): Promise<IWorkflowStateGatewayStartStepResponse>;
    approveWorkflowStateStep(
        params: IWorkflowStateGatewayApproveStepParams
    ): Promise<IWorkflowStateGatewayApproveStepResponse>;
    rejectWorkflowStateStep(
        params: IWorkflowStateGatewayRejectStepParams
    ): Promise<IWorkflowStateGatewayRejectStepResponse>;
    cancelWorkflowState(id: string): Promise<IWorkflowStateGatewayCancelStateResponse>;
    getTargetWorkflowState(
        app: string,
        targetRevisionId: string
    ): Promise<IWorkflowStateGatewayGetTargetWorkflowStateResponse>;
    listWorkflowStates(
        params?: IWorkflowStateGatewayListWorkflowStatesParams
    ): Promise<IWorkflowStateGatewayListWorkflowStatesResponse>;
}
