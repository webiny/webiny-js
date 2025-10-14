import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowInput } from "~/context/abstractions/WorkflowInput.js";
import type { IWorkflow } from "~/context/abstractions/Workflow.js";

export interface IWorkflowsTransformer {
    toCmsEntry(input: IWorkflowInput): IWorkflow;
    fromCmsEntry(input: CmsEntry<Omit<IWorkflow, "id">>): IWorkflow;
}
