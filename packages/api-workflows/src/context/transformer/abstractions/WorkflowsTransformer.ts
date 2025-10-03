import type { IWorkflow, IWorkflowInput } from "~/types.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowsTransformer {
    toCmsEntry(input: IWorkflowInput): IWorkflow;
    fromCmsEntry(input: CmsEntry<Omit<IWorkflow, "id">>): IWorkflow;
}
