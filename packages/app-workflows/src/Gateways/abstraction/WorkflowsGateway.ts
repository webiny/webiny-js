import { IWorkflow, type IWorkflowApplication } from "~/types.js";
import { IWorkflowModel } from "../../Models/index.js";
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

export interface IWorkflowsGatewayListWorkflowsResponse {
    data: IWorkflow[] | null;
    error: IWorkflowError | null;
}

export interface IWorkflowsGatewayStoreWorkflowResponse {
    data: IWorkflow | null;
    error: IWorkflowError | null;
}

export interface IWorkflowsGateway {
    app: IWorkflowApplication;
    deleteWorkflow(workflow: IWorkflowModel): Promise<IWorkflowsGatewayDeleteWorkflowResponse>;
    storeWorkflow(workflow: IWorkflowModel): Promise<IWorkflowsGatewayStoreWorkflowResponse>;
    listWorkflows(): Promise<IWorkflowsGatewayListWorkflowsResponse>;
}
