import { createFeature } from "@webiny/feature/api";
import { NullReviewStateOnRevisionCreate } from "./NullReviewStateOnRevisionCreate.js";
import { BlockUpdateWhileInReview } from "./BlockUpdateWhileInReview.js";
import { RequireApprovedReviewOnPublish } from "./RequireApprovedReviewOnPublish.js";
import { BlockMoveWhileInReview } from "./BlockMoveWhileInReview.js";

/**
 * Workflow handlers on CMS events (spec 9.2). The single handlers cover every app built on CMS
 * entries (R51); the `cms.*` adapter rules act on public CMS models only (R52).
 */
export const CmsHooksFeature = createFeature({
    name: "CmsWorkflows/Hooks",
    register(container) {
        // Single handlers (CMS entries and Website Builder pages)
        container.register(NullReviewStateOnRevisionCreate);
        container.register(BlockUpdateWhileInReview);

        // `cms.*` adapter rules (public CMS models only, R52)
        container.register(RequireApprovedReviewOnPublish);
        container.register(BlockMoveWhileInReview);
    }
});
