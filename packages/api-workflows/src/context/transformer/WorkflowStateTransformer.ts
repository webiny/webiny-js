import type { IWorkflowStateTransformer } from "~/context/transformer/abstractions/WorkflowStateTransformer.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";

export class WorkflowStateTransformer implements IWorkflowStateTransformer {
    public fromCmsEntry(input: CmsEntry<Omit<IWorkflowStateRecord, "id">>): IWorkflowStateRecord {
        return {
            id: input.id,
            workflowId: input.values.workflowId,
            targetId: input.values.targetId,
            steps: input.values.steps,
            app: input.values.app,
            state: input.values.state,
            comment: input.values.comment
        };
    }
}
