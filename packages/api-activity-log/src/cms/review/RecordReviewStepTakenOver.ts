import { WorkflowStateTakeOverStepHandler } from "@webiny/api-workflows/features/workflowState/TakeOverWorkflowStateStep/events.js";
import { ReviewActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * Ownership of an in-review step changed hands. The step's state does not move, only its owner, which is exactly the kind of thing someone asks about months later.
 */
class RecordReviewStepTakenOverImpl implements WorkflowStateTakeOverStepHandler.Interface {
    constructor(private recorder: ReviewActivityRecorder.Interface) {}

    async handle(event: WorkflowStateTakeOverStepHandler.Event): Promise<void> {
        await this.recorder.record({
            state: event.payload.state,
            action: "review.step.takenOver"
        });
    }
}

export const RecordReviewStepTakenOver = WorkflowStateTakeOverStepHandler.createImplementation({
    implementation: RecordReviewStepTakenOverImpl,
    dependencies: [ReviewActivityRecorder]
});
