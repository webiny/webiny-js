import { createFeature } from "@webiny/feature/api";
import { RoutingStepAssignmentResolver } from "./StepAssignmentResolver/RoutingStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";
import { ReviewTargetEditorService } from "./ReviewTargetEditorService/ReviewTargetEditorService.js";
import { ReviewTargetUpdateGuard } from "./ReviewTargetUpdateGuard/ReviewTargetUpdateGuard.js";
import { ReviewTargetFolderChangeGuard } from "./ReviewTargetFolderChangeGuard/ReviewTargetFolderChangeGuard.js";

/**
 * Defaults for the review lifecycle. The app target adapters register one `ReviewTargetLoader`,
 * `ReviewTargetSync`, `ReviewTargetReadAccess`, `ReviewTargetFolderChain` and `ReviewTargetEditor`
 * per namespace
 * (`cms.*` in api-headless-cms-workflows, `wb.page` in api-website-builder-workflows); the last
 * registered match wins and none matching means nothing to load, sync or read (R28, R50). Steps
 * are routed by `RoutingStepAssignmentResolver` (spec 6); a `StepAssignmentResolver` registered
 * later (after `WorkflowsFeature`) wins on resolve.
 */
export const ReviewLifecycleFeature = createFeature({
    name: "Workflows/ReviewLifecycle",
    register(container) {
        container.register(RoutingStepAssignmentResolver);
        container.register(ReviewStepReacher);
        container.register(ReviewSaver);
        // Picks the AI tools' target editor per namespace (spec 9.3); the adapters register them
        container.register(ReviewTargetEditorService);
        // The save block and the folder-change rule the adapters' update handlers share (R54, D84).
        container.register(ReviewTargetUpdateGuard);
        container.register(ReviewTargetFolderChangeGuard);
    }
});
