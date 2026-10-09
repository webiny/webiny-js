import { createFeature } from "@webiny/feature/api";
import { NoopReviewTargetSync } from "./ReviewTargetSync/NoopReviewTargetSync.js";
import { PoolStepAssignmentResolver } from "./StepAssignmentResolver/PoolStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";

/**
 * Defaults for the review lifecycle. Later phases register their own `ReviewTargetSync` (2) and
 * `StepAssignmentResolver` (4) after `WorkflowsFeature`; the last registration wins on resolve.
 */
export const ReviewLifecycleFeature = createFeature({
    name: "Workflows/ReviewLifecycle",
    register(container) {
        container.register(NoopReviewTargetSync);
        container.register(PoolStepAssignmentResolver);
        container.register(ReviewStepReacher);
        container.register(ReviewSaver);
    }
});
