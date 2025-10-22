import type { IWorkflowStep } from "./Workflow.js";

export enum WorkflowStateRecordState {
    pending = "pending",
    inReview = "inReview",
    approved = "approved",
    rejected = "rejected"
}

/**
 * We require all data from the workflow step to be stored in the state step.
 */
export interface IWorkflowStateRecordStep extends IWorkflowStep {
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
    isActive: boolean;
    comment: string | undefined;
    state: WorkflowStateRecordState;
    steps: IWorkflowStateRecordStep[];
    createdOn: Date;
    savedOn: Date;
    createdBy: IWorkflowStateIdentity;
    savedBy: IWorkflowStateIdentity;
}

export interface IWorkflowState {
    readonly done: boolean;
    // readonly workflow: IWorkflow | null | undefined;
    readonly record: IWorkflowStateRecord;
    readonly activeStep: IWorkflowStateRecordStep | undefined;
    start(): Promise<void>;
    approve(comment?: string): Promise<void>;
    reject(comment: string): Promise<void>;
}
