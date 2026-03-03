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

declare module "@webiny/app-website-builder/types.js" {
    export interface WbSystem {
        workflow: IRecordWorkflow | null;
    }
}

declare module "@webiny/app-website-builder/domain/Page/PageDto.js" {
    export interface PageDto {
        $selectable: boolean;
    }
}
