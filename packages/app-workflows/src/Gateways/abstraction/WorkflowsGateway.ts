import type { IWorkflow } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";

export interface IWorkflowErrorDataInvalidFieldData {
    path: NonEmptyArray<string>;
}

export interface IWorkflowErrorDataInvalidField {
    code: string;
    message: string;
    data: IWorkflowErrorDataInvalidFieldData;
}

export interface IWorkflowErrorDataInvalidFields {
    [key: string]: IWorkflowErrorDataInvalidField;
}

export interface IWorkflowErrorData {
    invalidFields: IWorkflowErrorDataInvalidFields;
}

export interface IWorkflowError {
    code: string | null;
    message: string;
    data?: IWorkflowErrorData;
    stack?: string;
}

export interface IWorkflowsGatewayDeleteWorkflowResponse {
    data: boolean | null;
    error: IWorkflowError | null;
}

export interface IWorkflowsGatewayListParamsWhere {
    app: string;
}

export interface IWorkflowsGatewayListParams {
    where?: IWorkflowsGatewayListParamsWhere;
}

export interface IWorkflowsGatewayListWorkflowsResponse {
    data: IWorkflow[] | null;
    error: IWorkflowError | null;
}

export interface IWorkflowsGatewayStoreWorkflowResponse {
    data: IWorkflow | null;
    error: IWorkflowError | null;
}

export interface IWorkflowsGateway {
    deleteWorkflow(workflow: IWorkflow): Promise<IWorkflowsGatewayDeleteWorkflowResponse>;
    storeWorkflow(workflow: IWorkflow): Promise<IWorkflowsGatewayStoreWorkflowResponse>;
    listWorkflows(
        params?: IWorkflowsGatewayListParams
    ): Promise<IWorkflowsGatewayListWorkflowsResponse>;
}
