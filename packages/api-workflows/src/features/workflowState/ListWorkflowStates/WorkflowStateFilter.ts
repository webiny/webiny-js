import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

/**
 * Returns the states the current identity may read. Used by the list and both get use cases.
 * Decorators handle the states of their own app and pass the rest to the decoratee.
 */
export interface IWorkflowStateFilter {
    filter(items: WorkflowState[]): Promise<WorkflowState[]>;
}

export const WorkflowStateFilter = createAbstraction<IWorkflowStateFilter>("WorkflowStateFilter");

export namespace WorkflowStateFilter {
    export type Interface = IWorkflowStateFilter;
}
