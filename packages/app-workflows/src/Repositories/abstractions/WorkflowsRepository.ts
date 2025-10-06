import type { IWorkflow } from "~/types.js";
import type { IWorkflowModel } from "../../Models/abstractions/WorkflowModel.js";

export interface IWorkflowsRepository {
    error: Error | null;
    loading: boolean;
    init(): Promise<void>;
    find(id: string): IWorkflowModel | null;
    findOne(id: string): IWorkflowModel;
    save(input: IWorkflow): void;
    remove(workflowId: string): void;
    list(): IWorkflowModel[];
}
