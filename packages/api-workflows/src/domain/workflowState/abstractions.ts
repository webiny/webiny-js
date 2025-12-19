import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import type { IWorkflowStep } from "../workflow/abstractions.js";

export enum WorkflowStateRecordState {
    pending = "pending",
    inReview = "inReview",
    approved = "approved",
    rejected = "rejected"
}

export interface IWorkflowStateIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface IWorkflowStateRecordStep extends IWorkflowStep {
    state: WorkflowStateRecordState;
    comment: string | null;
    savedBy: IWorkflowStateIdentity | null;
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

export interface IWorkflowState {
    readonly id: string;
    readonly app: string;
    readonly title: string;
    readonly workflowId: string;
    readonly targetId: string;
    readonly targetRevisionId: string;
    readonly isActive: boolean;
    readonly comment: string | undefined;
    readonly state: WorkflowStateRecordState;
    readonly steps: IEnrichedWorkflowStateRecordStep[];
    readonly createdOn: Date;
    readonly savedOn: Date;
    readonly createdBy: IWorkflowStateIdentity;
    readonly savedBy: IWorkflowStateIdentity;
    readonly done: boolean;
    readonly currentStep: IEnrichedWorkflowStateRecordStep;
    readonly nextStep: IEnrichedWorkflowStateRecordStep | null;
    readonly previousStep: IEnrichedWorkflowStateRecordStep | null;
}

// Abstractions
export const WorkflowStateModel = createAbstraction<CmsModel>("WorkflowStateModel");

export namespace WorkflowStateModel {
    export type Interface = CmsModel;
}

export type IWorkflowStateTransformerFromCmsEntryInput = CmsEntry<
    Omit<IWorkflowStateRecord, "id" | "savedOn" | "createdOn" | "savedBy" | "createdBy">
>;

export type IWorkflowStateTransformerFromCmsEntryOutput = IWorkflowStateRecord;

export type IWorkflowStateTransformerToCmsEntryInput = Omit<
    IWorkflowStateRecord,
    "savedOn" | "createdOn" | "savedBy"
>;

export type IWorkflowStateTransformerToCmsEntryOutput = Omit<
    IWorkflowStateRecord,
    "id" | "savedOn" | "createdOn" | "savedBy" | "createdBy"
>;

export interface IWorkflowStateMapper {
    fromCmsEntry(
        input: IWorkflowStateTransformerFromCmsEntryInput
    ): IWorkflowStateTransformerFromCmsEntryOutput;
    toCmsEntry(
        input: IWorkflowStateTransformerToCmsEntryInput
    ): IWorkflowStateTransformerToCmsEntryOutput;
}

export const WorkflowStateMapper = createAbstraction<IWorkflowStateMapper>("WorkflowStateMapper");

export namespace WorkflowStateMapper {
    export type Interface = IWorkflowStateMapper;
}
