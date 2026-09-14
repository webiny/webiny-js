import { WorkflowStateAfterCreateHandler } from "@webiny/api-workflows/features/workflowState/CreateWorkflowState/events.js";
import { ReviewActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A workflow state coming into existence is the entry being submitted for review.
 */
class RecordReviewSubmittedImpl implements WorkflowStateAfterCreateHandler.Interface {
    constructor(private recorder: ReviewActivityRecorder.Interface) {}

    async handle(event: WorkflowStateAfterCreateHandler.Event): Promise<void> {
        await this.recorder.record({
            state: event.payload.state,
            action: "review.submitted"
        });
    }
}

export const RecordReviewSubmitted = WorkflowStateAfterCreateHandler.createImplementation({
    implementation: RecordReviewSubmittedImpl,
    dependencies: [ReviewActivityRecorder]
});
