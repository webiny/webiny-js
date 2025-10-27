import type {
    IWorkflowStateTransformer,
    IWorkflowStateTransformerFromCmsEntryInput,
    IWorkflowStateTransformerFromCmsEntryOutput,
    IWorkflowStateTransformerToCmsEntryInput,
    IWorkflowStateTransformerToCmsEntryOutput
} from "./abstractions/WorkflowStateTransformer.js";
import type { IWidgetWorkflowState } from "~/context/abstractions/WidgetWorkflowState.js";
import {
    type IWorkflowStateRecordStep,
    WorkflowStateRecordState
} from "~/context/abstractions/WorkflowState.js";

export class WorkflowStateTransformer implements IWorkflowStateTransformer {
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

    public toWidgetWorkflowState(
        input: IWorkflowStateTransformerFromCmsEntryOutput
    ): IWidgetWorkflowState {
        return {
            id: input.id,
            app: input.app,
            state: input.state,
            savedBy: input.savedBy,
            savedOn: input.savedOn,
            step: this.getActiveStep(input.steps),
            title: input.title,
            targetRevisionId: input.targetRevisionId
        };
    }

    private getActiveStep(steps: IWorkflowStateRecordStep[]): IWorkflowStateRecordStep {
        const discarded = steps.find(step => step.state === WorkflowStateRecordState.rejected);
        if (discarded) {
            return discarded;
        }
        const inReview = steps.find(step => step.state === WorkflowStateRecordState.inReview);
        if (inReview) {
            return inReview;
        }
        const approved = steps.find(step => step.state === WorkflowStateRecordState.approved);
        if (approved) {
            return approved;
        }
        const pending = steps.find(step => step.state === WorkflowStateRecordState.pending);
        if (pending) {
            return pending;
        }
        return steps[steps.length - 1];
    }
}
