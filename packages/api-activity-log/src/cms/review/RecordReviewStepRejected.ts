import { WorkflowStateRejectHandler } from "@webiny/api-workflows/features/workflowState/RejectWorkflowStateStep/events.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { ReviewActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A step was rejected, which on this branch always ends the review.
 *
 * `getActiveStep()` returns null once any step is rejected, so no further transition is possible
 * and the record-level state is terminal. The pairing is the same as approval's: the step fact and
 * the review fact, two records sharing a correlation id — with the record-level one written only
 * because it is terminal, not because it mirrors the step.
 *
 * The terminal state is still read from the record rather than assumed, so that a future APW
 * change allowing a rejected step to be reopened does not silently start producing a wrong record.
 */
class RecordReviewStepRejectedImpl implements WorkflowStateRejectHandler.Interface {
    constructor(private recorder: ReviewActivityRecorder.Interface) {}

    async handle(event: WorkflowStateRejectHandler.Event): Promise<void> {
        const { state } = event.payload;
        const correlationId = generateAlphaNumericLowerCaseId(12);

        await this.recorder.record({
            state,
            action: "review.step.rejected",
            correlationId
        });

        if (state.state === "rejected") {
            await this.recorder.record({
                state,
                action: "review.rejected",
                correlationId
            });
        }
    }
}

export const RecordReviewStepRejected = WorkflowStateRejectHandler.createImplementation({
    implementation: RecordReviewStepRejectedImpl,
    dependencies: [ReviewActivityRecorder]
});
