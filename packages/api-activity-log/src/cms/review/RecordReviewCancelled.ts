import { WorkflowStateCancelHandler } from "@webiny/api-workflows/features/workflowState/CancelWorkflowState/events.js";
import { ReviewActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * The review was called off. Note that cancel is the one action that also publishes workflowState.afterUpdate, which is part of why this feature subscribes to the action events and not to afterUpdate.
 */
class RecordReviewCancelledImpl implements WorkflowStateCancelHandler.Interface {
    constructor(private recorder: ReviewActivityRecorder.Interface) {}

    async handle(event: WorkflowStateCancelHandler.Event): Promise<void> {
        await this.recorder.record({
            state: event.payload.state,
            action: "review.cancelled"
        });
    }
}

export const RecordReviewCancelled = WorkflowStateCancelHandler.createImplementation({
    implementation: RecordReviewCancelledImpl,
    dependencies: [ReviewActivityRecorder]
});
