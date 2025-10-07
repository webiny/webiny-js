import type { IWorkflow } from "~/types.js";
import type { IWorkflowModel } from "../../Models/abstractions/WorkflowModel.js";
import type { IWorkflowError } from "~/Gateways/abstraction/WorkflowsGateway.js";

export interface IWorkflowsRepository {
    readonly error: IWorkflowError | null;
    readonly loading: boolean;
    readonly workflows: IWorkflowModel[];
    init(): Promise<void>;
    find(id: string): IWorkflowModel | null;
    findOne(id: string): IWorkflowModel;
    save(input: IWorkflow): Promise<void>;
    remove(workflowId: string): Promise<void>;
    list(): IWorkflowModel[];
}
