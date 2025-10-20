import type {
    IWorkflowStateTransformer,
    IWorkflowStateTransformerFromCmsEntryInput,
    IWorkflowStateTransformerFromCmsEntryOutput,
    IWorkflowStateTransformerToCmsEntryInput,
    IWorkflowStateTransformerToCmsEntryOutput
} from "./abstractions/WorkflowStateTransformer.js";

export class WorkflowStateTransformer implements IWorkflowStateTransformer {
    public fromCmsEntry(
        input: IWorkflowStateTransformerFromCmsEntryInput
    ): IWorkflowStateTransformerFromCmsEntryOutput {
        return {
            id: input.id,
            workflowId: input.values.workflowId,
            targetId: input.values.targetId,
            targetRevisionId: input.values.targetRevisionId,
            steps: input.values.steps,
            app: input.values.app,
            state: input.values.state,
            comment: input.values.comment,
            savedBy: input.savedBy,
            createdBy: input.createdBy,
            savedOn: new Date(input.savedOn),
            createdOn: new Date(input.createdOn)
        };
    }

    public toCmsEntry(
        input: IWorkflowStateTransformerToCmsEntryInput
    ): IWorkflowStateTransformerToCmsEntryOutput {
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
