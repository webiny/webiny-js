import { IWorkflow } from "~/types.js";

export interface IWorkflowsGateway {
    storeWorkflows(workflows: IWorkflow[]): void;
    getWorkflows(): IWorkflow[];
}
