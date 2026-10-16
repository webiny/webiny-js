import type { GenericRecord } from "@webiny/app/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
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

export interface IWorkflowNotificationType {
    id: string;
    title: string;
}

export interface IWorkflow {
    id: string;
    app: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStep>;
}

export enum WorkflowsSecurityPermissionAccessLevel {
    NO = "no",
    YES = "yes"
}

export interface IWorkflowsSecurityPermission extends Identity.Permission {
    editor: WorkflowsSecurityPermissionAccessLevel;
}
