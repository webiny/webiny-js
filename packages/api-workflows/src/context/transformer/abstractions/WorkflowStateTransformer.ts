import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";

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

export interface IWorkflowStateTransformer {
    fromCmsEntry(
        input: IWorkflowStateTransformerFromCmsEntryInput
    ): IWorkflowStateTransformerFromCmsEntryOutput;
    toCmsEntry(
        input: IWorkflowStateTransformerToCmsEntryInput
    ): IWorkflowStateTransformerToCmsEntryOutput;
}
