import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

export interface IWorkflowStateFilter {
    filter(items: WorkflowState[]): Promise<WorkflowState[]>;
}

export const WorkflowStateFilter = createAbstraction<IWorkflowStateFilter>("WorkflowStateFilter");

export namespace WorkflowStateFilter {
    export type Interface = IWorkflowStateFilter;
}
