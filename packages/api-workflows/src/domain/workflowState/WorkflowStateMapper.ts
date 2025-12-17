import type {
    IWorkflowStateMapper,
    IWorkflowStateTransformerFromCmsEntryInput,
    IWorkflowStateTransformerFromCmsEntryOutput,
    IWorkflowStateTransformerToCmsEntryInput,
    IWorkflowStateTransformerToCmsEntryOutput
} from "./abstractions.js";
import { WorkflowStateMapper as WorkflowStateMapperAbstraction } from "./abstractions.js";

// NOTE: Copied implementation from context/transformer/WorkflowStateTransformer.ts
class WorkflowStateMapperImpl implements IWorkflowStateMapper {
    public fromCmsEntry(
        input: IWorkflowStateTransformerFromCmsEntryInput
    ): IWorkflowStateTransformerFromCmsEntryOutput {
        return {
            id: input.id,
            workflowId: input.values.workflowId,
            title: input.values.title,
            targetId: input.values.targetId,
            targetRevisionId: input.values.targetRevisionId,
            steps: input.values.steps,
            isActive: input.values.isActive,
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
            isActive: input.isActive,
            title: input.title,
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

export const WorkflowStateMapper = WorkflowStateMapperAbstraction.createImplementation({
    implementation: WorkflowStateMapperImpl,
    dependencies: []
});
