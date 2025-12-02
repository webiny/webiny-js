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

export interface IWorkflowStateRecord<
    Steps extends IWorkflowStateRecordStep = IWorkflowStateRecordStep
> {
    id: string;
    app: string;
    title: string;
    workflowId: string;
    targetId: string;
    targetRevisionId: string;
    isActive: boolean;
    comment: string | undefined;
    state: WorkflowStateRecordState;
    steps: Steps[];
    createdOn: Date;
    savedOn: Date;
    createdBy: IWorkflowStateIdentity;
    savedBy: IWorkflowStateIdentity;
}

export interface IEnrichedWorkflowStateRecordStep extends IWorkflowStateRecordStep {
    isOwner: boolean;
    canTakeOver: boolean;
    canReview: boolean;
}

export interface IWorkflowState<
    T extends IEnrichedWorkflowStateRecordStep = IEnrichedWorkflowStateRecordStep
> extends IWorkflowStateRecord<T> {
    readonly done: boolean;
    currentStep: T;
    nextStep: T | null;
    previousStep: T | null;
}

export interface IWorkflowStateModel extends IWorkflowState {
    getActiveStep(): IEnrichedWorkflowStateRecordStep | null;
    start(): Promise<void>;
    takeOver(): Promise<void>;
    approve(comment?: string): Promise<void>;
    reject(comment: string): Promise<void>;
}
