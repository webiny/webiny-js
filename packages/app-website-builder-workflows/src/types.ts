import type { WorkflowStateValue } from "@webiny/app-workflows/types.js";

export interface IRecordWorkflowStateIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface IRecordWorkflowState {
    workflowId: string;
    stepId: string;
    state: WorkflowStateValue;
    savedBy?: IRecordWorkflowStateIdentity | null;
}

export interface IRecordWorkflow {
    state?: IRecordWorkflowState | null;
}

export type WithWorkflows<T> = T & {
    workflows: IRecordWorkflow | null;
    $selectable: boolean;
};
