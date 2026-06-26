import type { WorkflowStateValue } from "@webiny/app-workflows/types.js";

export interface ICmsEntryWorkflowState {
    workflowId: string;
    stepId: string;
    stepName: string;
    state: WorkflowStateValue;
}

export interface ICmsEntrySystemWithWorkflow {
    workflow?: ICmsEntryWorkflowState | null;
}
