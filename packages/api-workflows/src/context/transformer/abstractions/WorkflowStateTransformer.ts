import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowStateTransformer {
    fromCmsEntry(input: CmsEntry<Omit<IWorkflowStateRecord, "id">>): IWorkflowStateRecord;
    toCmsEntry(input: IWorkflowStateRecord): Omit<IWorkflowStateRecord, "id">;
}
