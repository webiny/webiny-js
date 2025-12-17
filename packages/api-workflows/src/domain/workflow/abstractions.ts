import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IWorkflowInput } from "~/features/shared/abstractions.js";

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

// Abstractions
export const WorkflowModel = createAbstraction<CmsModel>("WorkflowModel");

export namespace WorkflowModel {
    export type Interface = CmsModel;
}

export interface IWorkflowMapper {
    fromCmsEntry(input: CmsEntry<Omit<IWorkflow, "id">>): IWorkflow;
    toCmsEntry(input: IWorkflowInput): IWorkflow;
}

export const WorkflowMapper = createAbstraction<IWorkflowMapper>("WorkflowMapper");

export namespace WorkflowMapper {
    export type Interface = IWorkflowMapper;
}
