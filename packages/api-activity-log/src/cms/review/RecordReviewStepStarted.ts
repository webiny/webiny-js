import { WorkflowStateStartStepHandler } from "@webiny/api-workflows/features/workflowState/StartWorkflowStateStep/events.js";
import { ReviewActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A reviewer picked up the next step. Worth recording separately from approval: on this branch an approval does NOT activate the next step — starting one is its own deliberate action — so without this the timeline would skip from one approval to the next with the intervening pickup invisible.
 */
class RecordReviewStepStartedImpl implements WorkflowStateStartStepHandler.Interface {
    constructor(private recorder: ReviewActivityRecorder.Interface) {}

    async handle(event: WorkflowStateStartStepHandler.Event): Promise<void> {
        await this.recorder.record({
            state: event.payload.state,
            action: "review.step.started"
        });
    }
}

export const RecordReviewStepStarted = WorkflowStateStartStepHandler.createImplementation({
    implementation: RecordReviewStepStartedImpl,
    dependencies: [ReviewActivityRecorder]
});
