import type { IWorkflow } from "./Workflow.js";


export enum WorkflowStateRecordState {
    pending = "pending",
    inReview = "inReview",
    approved = "approved",
    rejected = "rejected"
}

export interface IWorkflowStateRecordStep {
    id: string;
    state: WorkflowStateRecordState;
    comment?: string;
    userId: string;
}


export interface IWorkflowStateRecord {
    id: string;
    app: string;
    workflowId: string;
    targetId: string;
    comment?: string;
    state: WorkflowStateRecordState;
    steps: IWorkflowStateRecordStep[];
}

export interface IWorkflowState {
    readonly workflow: IWorkflow | undefined;
    readonly done: boolean;
    readonly record: IWorkflowStateRecord | undefined;
    approve(message?: string): Promise<void>;
    reject(message: string): Promise<void>;
    cancel(): Promise<void>;
}
