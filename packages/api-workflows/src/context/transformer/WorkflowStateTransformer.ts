import type { IWorkflowStateTransformer } from "~/context/transformer/abstractions/WorkflowStateTransformer.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IWorkflowStateRecord } from "~/context/abstractions/WorkflowState.js";

export class WorkflowStateTransformer implements IWorkflowStateTransformer {
    public fromCmsEntry(input: CmsEntry<Omit<IWorkflowStateRecord, "id">>): IWorkflowStateRecord {
        return {
            id: input.id,
            workflowId: input.values.workflowId,
            targetId: input.values.targetId,
            targetRevisionId: input.values.targetRevisionId,
            steps: input.values.steps,
            app: input.values.app,
            state: input.values.state,
            comment: input.values.comment
        };
    }

    public toCmsEntry(input: IWorkflowStateRecord): Omit<IWorkflowStateRecord, "id"> {
        return {
            workflowId: input.workflowId,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            steps: input.steps,
            app: input.app,
            state: input.state,
            comment: input.comment
        };
    }
}
