import { IWorkflow } from "~/types.js";
import { IWorkflowModel } from "../../Models/index.js";

export interface IWorkflowError {
    code: string | null;
    message: string;
    data?: Record<string, any>;
    stack?: string;
}

export interface IWorkflowsGatewayDeleteWorkflowResponse {
    data: boolean | null;
    error: IWorkflowError | null;
}

export interface IWorkflowsGatewayStoreWorkflowResponse {
    data: IWorkflow | null;
    error: IWorkflowError | null;
}

export interface IWorkflowsGateway {
    deleteWorkflow(workflow: IWorkflowModel): Promise<IWorkflowsGatewayDeleteWorkflowResponse>;
    storeWorkflow(workflow: IWorkflowModel): Promise<IWorkflowsGatewayStoreWorkflowResponse>;
    listWorkflows(): Promise<IWorkflow[]>;
}
