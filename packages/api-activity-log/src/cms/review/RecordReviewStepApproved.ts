import { WorkflowStateApproveStepHandler } from "@webiny/api-workflows/features/workflowState/ApproveWorkflowStateStep/events.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { ReviewActivityRecorder } from "~/cms/recorder/abstractions.js";

/**
 * A step was approved, and possibly the whole review with it.
 *
 * `WorkflowState.approve()` approves the active step and then sets the record-level state to
 * `approved` when there is no next step, or back to `pending` when there is. So a final approval
 * is genuinely two facts — this step is approved, and the review as a whole is approved — and it
 * gets two records sharing a correlation id.
 *
 * The record-level state is recorded **only when terminal**. A non-final approval moves the record
 * to `pending`, which merely mirrors the step transition and is derivable from it; recording that
 * too would put a second, uninformative row on the timeline for every approval. A terminal
 * `approved` is different in kind: it is the state that gates publishing, so it is the
 * governance-relevant fact rather than a derived one.
 *
 * The brief anticipated two records here for a different reason — it expected approval to activate
 * the next step. On this branch it does not; starting a step is its own action with its own event.
 * The two-record outcome is the same, the second record just means something else.
 */
class RecordReviewStepApprovedImpl implements WorkflowStateApproveStepHandler.Interface {
    constructor(private recorder: ReviewActivityRecorder.Interface) {}

    async handle(event: WorkflowStateApproveStepHandler.Event): Promise<void> {
        const { state } = event.payload;
        const correlationId = generateAlphaNumericLowerCaseId(12);

        await this.recorder.record({
            state,
            action: "review.step.approved",
            correlationId
        });

        if (state.state === "approved") {
            await this.recorder.record({
                state,
                action: "review.approved",
                correlationId
            });
        }
    }
}

export const RecordReviewStepApproved = WorkflowStateApproveStepHandler.createImplementation({
    implementation: RecordReviewStepApprovedImpl,
    dependencies: [ReviewActivityRecorder]
});
