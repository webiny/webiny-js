import { IWorkflow } from "~/types.js";
import { IWorkflowModel } from "../../models/index.js";

export interface IWorkflowsGateway {
    storeWorkflows(workflows: IWorkflowModel[]): void;
    getWorkflows(): IWorkflow[];
}
