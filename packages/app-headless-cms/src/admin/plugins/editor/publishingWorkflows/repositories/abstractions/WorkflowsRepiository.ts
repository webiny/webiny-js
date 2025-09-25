import type { IWorkflow } from "~/types.js";

export interface IWorkflowsRepository {
    find(id: string): IWorkflow | null;
    save(input: IWorkflow): void;
    remove(workflowId: string): void;
    list(): IWorkflow[];
}
