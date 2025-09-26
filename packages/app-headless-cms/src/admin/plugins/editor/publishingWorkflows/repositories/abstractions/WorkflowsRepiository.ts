import type { IWorkflow } from "~/types.js";
import type { IWorkflowModel } from "~/admin/plugins/editor/publishingWorkflows/models/abstractions/WorkflowModel.js";

export interface IWorkflowsRepository {
    find(id: string): IWorkflowModel | null;
    findOne(id: string): IWorkflowModel;
    save(input: IWorkflow): void;
    remove(workflowId: string): void;
    list(): IWorkflowModel[];
}
