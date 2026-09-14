import { WorkflowStateAfterDeleteHandler } from "@webiny/api-workflows/features/workflowState/DeleteTargetWorkflowState/events.js";
import { ReviewActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * The workflow state was removed outright, as opposed to being cancelled.
 */
class RecordReviewDeletedImpl implements WorkflowStateAfterDeleteHandler.Interface {
    constructor(private recorder: ReviewActivityRecorder.Interface) {}

    async handle(event: WorkflowStateAfterDeleteHandler.Event): Promise<void> {
        await this.recorder.record({
            state: event.payload.state,
            action: "review.deleted"
        });
    }
}

export const RecordReviewDeleted = WorkflowStateAfterDeleteHandler.createImplementation({
    implementation: RecordReviewDeletedImpl,
    dependencies: [ReviewActivityRecorder]
});
