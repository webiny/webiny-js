import type { IWorkflow } from "~/types.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowsTransformer {
    toCmsEntry(input: IWorkflow): Omit<IWorkflow, "id">;
    fromCmsEntry(input: CmsEntry<Omit<IWorkflow, "id">>): IWorkflow;
}
