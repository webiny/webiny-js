import { IWorkflow } from "~/types.js";
import { IWorkflowModel } from "../../Models/index.js";

export interface IWorkflowsGateway {
    storeWorkflows(workflows: IWorkflowModel[]): Promise<void>;
    listWorkflows(): Promise<IWorkflow[]>;
}
