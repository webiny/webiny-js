import { createFeature } from "@webiny/feature/api";
import { PoolStepAssignmentResolver } from "./StepAssignmentResolver/PoolStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";

/**
 * Defaults for the review lifecycle. The app target adapters register one `ReviewTargetLoader`,
 * `ReviewTargetSync` and `ReviewTargetReadAccess` per namespace (`cms.*` in
 * api-headless-cms-workflows, `wb.page` in api-website-builder-workflows); the last registered
 * match wins and none matching means nothing to load, sync or read (R28, R50). Phase 4 registers
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
