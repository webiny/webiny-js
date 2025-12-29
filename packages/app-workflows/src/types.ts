import type { GenericRecord, NonEmptyArray } from "@webiny/app/types.js";
import type { ReactElement } from "react";
import { Identity } from "@webiny/app-admin/domain/Identity.js";

export interface IGenericMeta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}

export interface IGenericError {
    message: string;
    code: string | null;
    data?: GenericRecord;
    stack?: string;
}

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

/**
 * We have all info from workflow step and extend it with a state step.
 */
export interface IWorkflowStateStep extends IWorkflowStep {
    state: WorkflowStateValue;
    comment: string | null | undefined;
    savedBy: IIdentity | null | undefined;
    canTakeOver: boolean;
    canReview: boolean;
    isOwner: boolean;
}

export interface IWorkflowState {
    id: string;
    title: string;
    isActive: boolean;
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
    currentStep: IWorkflowStateStep;
    nextStep: IWorkflowStateStep | null;
    previousStep: IWorkflowStateStep | null;
}

export enum WorkflowsSecurityPermissionAccessLevel {
    NO = "no",
    YES = "yes"
}

export interface IWorkflowsSecurityPermission extends Identity.Permission {
    editor: WorkflowsSecurityPermissionAccessLevel;
}
