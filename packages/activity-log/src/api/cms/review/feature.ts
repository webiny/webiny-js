import { type Container, createFeature } from "@webiny/feature/api";
import { RecordReviewCancelled } from "./RecordReviewCancelled.js";
import { RecordReviewDeleted } from "./RecordReviewDeleted.js";
import { RecordReviewStepApproved } from "./RecordReviewStepApproved.js";
import { RecordReviewStepRejected } from "./RecordReviewStepRejected.js";
import { RecordReviewStepStarted } from "./RecordReviewStepStarted.js";
import { RecordReviewStepTakenOver } from "./RecordReviewStepTakenOver.js";
import { RecordReviewSubmitted } from "./RecordReviewSubmitted.js";
import { ReviewActivityRecorder } from "./ReviewActivityRecorder.js";

/**
 * Publishing workflow capture.
 *
 * Subscribes to APW's own action events, not to `workflowState.afterUpdate`. See the Checkpoint 4
 * notes in the plan: `afterUpdate` is published only by `UpdateWorkflowStateUseCase`, which the
 * four step actions bypass entirely, so diffing it would miss every step transition.
 */
export const ReviewCaptureFeature = createFeature({
    name: "ActivityLog/ReviewCapture",
    register(container: Container) {
        container.register(ReviewActivityRecorder).inSingletonScope();

        container.register(RecordReviewSubmitted);
        container.register(RecordReviewStepStarted);
        container.register(RecordReviewStepApproved);
        container.register(RecordReviewStepRejected);
        container.register(RecordReviewStepTakenOver);
        container.register(RecordReviewCancelled);
        container.register(RecordReviewDeleted);
    }
});
