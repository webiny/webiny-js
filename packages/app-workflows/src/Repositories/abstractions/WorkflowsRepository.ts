import type { IWorkflow } from "~/types.js";
import type { IWorkflowModel } from "../../Models/abstractions/WorkflowModel.js";
import type { IWorkflowError } from "~/Gateways/abstraction/WorkflowsGateway.js";

export interface IWorkflowsRepository {
    error: IWorkflowError | null;
    loading: boolean;
    init(): Promise<void>;
    find(id: string): IWorkflowModel | null;
    findOne(id: string): IWorkflowModel;
    save(input: IWorkflow): Promise<void>;
    remove(workflowId: string): void;
    list(): IWorkflowModel[];
}
