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
    comment: string | undefined;
    userId: string | undefined;
}

export interface IWorkflowStateRecord {
    id: string;
    app: string;
    workflowId: string;
    targetId: string;
    targetRevisionId: string;
    comment: string | undefined;
    state: WorkflowStateRecordState;
    steps: IWorkflowStateRecordStep[];
}

export interface IWorkflowStateStep extends IWorkflowStateRecordStep {
    name: string;
}

export interface IWorkflowState {
    readonly done: boolean;
    readonly workflow: IWorkflow | null | undefined;
    readonly record: IWorkflowStateRecord | undefined;
    readonly activeStep: IWorkflowStateStep | undefined;
    review(): Promise<void>;
    approve(message?: string): Promise<void>;
    reject(message: string): Promise<void>;
    cancel(): Promise<void>;
}
