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
    comment: string | null;
    savedBy: IWorkflowStateIdentity | null;
}

export interface IWorkflowStateIdentity {
    id: string;
    displayName: string | null;
    type: string | null;
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
    createdOn: Date;
    savedOn: Date;
    createdBy: IWorkflowStateIdentity;
    savedBy: IWorkflowStateIdentity;
}

export interface IWorkflowStateStep extends IWorkflowStateRecordStep {
    name: string;
}

export interface IWorkflowState {
    readonly done: boolean;
    readonly workflow: IWorkflow | null | undefined;
    readonly record: IWorkflowStateRecord | undefined;
    readonly activeStep: IWorkflowStateStep | undefined;
    start(): Promise<void>;
    approve(comment?: string): Promise<void>;
    reject(comment: string): Promise<void>;
}
