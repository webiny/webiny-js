import { createFeature } from "@webiny/feature/api";
import { RoutingStepAssignmentResolver } from "./StepAssignmentResolver/RoutingStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";

/**
 * Defaults for the review lifecycle. The app target adapters register one `ReviewTargetLoader`,
 * `ReviewTargetSync`, `ReviewTargetReadAccess` and `ReviewTargetFolderChain` per namespace
 * (`cms.*` in api-headless-cms-workflows, `wb.page` in api-website-builder-workflows); the last
 * registered match wins and none matching means nothing to load, sync or read (R28, R50). Steps
 * are routed by `RoutingStepAssignmentResolver` (spec 6).
 */
export const ReviewLifecycleFeature = createFeature({
    name: "Workflows/ReviewLifecycle",
    register(container) {
        container.register(RoutingStepAssignmentResolver);
        container.register(ReviewStepReacher);
        container.register(ReviewSaver);
    }
});
