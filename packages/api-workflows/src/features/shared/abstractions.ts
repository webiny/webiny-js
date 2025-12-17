import type { NonEmptyArray } from "@webiny/api/types.js";

export interface IWorkflowStepTeamInput {
    id: string;
}

export interface IWorkflowStepNotificationInput {
    id: string;
}

export interface IWorkflowStepInput {
    id: string;
    title: string;
    color: string;
    description?: string;
    teams: NonEmptyArray<IWorkflowStepTeamInput>;
    notifications?: IWorkflowStepNotificationInput[];
}
export interface IWorkflowInput {
    id: string;
    app: string;
    name: string;
    steps: NonEmptyArray<IWorkflowStepInput>;
}
