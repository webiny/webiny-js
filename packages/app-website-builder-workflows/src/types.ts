import type { WorkflowStateValue } from "@webiny/app-workflows/types.js";

export interface IPageWorkflowState {
    workflowId: string;
    stepId: string;
    stepName: string;
    state: WorkflowStateValue;
}

export type WithWorkflows<T> = T & {
    workflow: IPageWorkflowState | null;
};

declare module "@webiny/app-website-builder/types.js" {
    export interface WbPageSystem {
        workflow: IPageWorkflowState | null;
    }
}
