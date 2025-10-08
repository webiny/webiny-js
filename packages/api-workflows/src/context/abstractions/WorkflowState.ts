import type { IWorkflow } from "./Workflow.js";

export interface IWorkflowStateData {
    step: string;
}

export interface IWorkflowState {
    id: string;
    workflow: IWorkflow;
    state: IWorkflowStateData;
}

export enum IWorkflowStateRecordStepsStatus {
    pending = "pending",
    resolving = "resolving",
    approved = "approved",
    rejected = "rejected"
}

export interface IWorkflowStateRecordSteps {
    id: string;
    status: IWorkflowStateRecordStepsStatus;
    userId: string;
}

export interface IWorkflowStateRecord {
    id: string;
    app: string;
    workflowId: string;
    targetId: string;
    steps: IWorkflowStateRecordSteps[];
}
