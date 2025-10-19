import type { NonEmptyArray } from "@webiny/app/types.js";
import type { ReactElement } from "react";

export interface IWorkflowApplication {
    id: string;
    icon: ReactElement;
    name: string;
}

export interface IWorkflowStepNotification {
    id: string;
}

export interface IWorkflowStepTeam {
    id: string;
}

export interface IWorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeam>;
    notifications?: IWorkflowStepNotification[];
}

export interface IWorkflow {
    id: string;
    app: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStep>;
}

export enum WorkflowStateValue {
    pending = "pending",
    inReview = "inReview",
    approved = "approved",
    rejected = "rejected"
}

export interface IIdentity {
    id: string;
    displayName?: string;
    type?: string;
}

export interface IWorkflowStateStep {
    id: string;
    state: WorkflowStateValue;
    comment: string | null | undefined;
    savedBy: IIdentity | null | undefined;
}

export interface IWorkflowState {
    readonly workflow: IWorkflow;
    id: string;
    app: string;
    targetId: string;
    targetRevisionId: string;
    comment: string | null | undefined;
    state: WorkflowStateValue;
    steps: IWorkflowStateStep[];
    createdBy: IIdentity;
    savedBy: IIdentity;
    createdOn: Date;
    savedOn: Date;
}
