import { createFeature } from "@webiny/feature/api";
import { PoolStepAssignmentResolver } from "./StepAssignmentResolver/PoolStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";

/**
 * Defaults for the review lifecycle. Phase 2 registers one `ReviewTargetSync` per namespace (the
 * last one whose `canSync` matches wins; none matching means nothing to sync). Phase 4 registers
 * its `StepAssignmentResolver` after `WorkflowsFeature`; the last registration wins on resolve.
 */
export const ReviewLifecycleFeature = createFeature({
    name: "Workflows/ReviewLifecycle",
    register(container) {
        container.register(PoolStepAssignmentResolver);
        container.register(ReviewStepReacher);
        container.register(ReviewSaver);
    }
});
