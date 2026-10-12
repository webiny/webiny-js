import { createFeature } from "@webiny/feature/api";
import { RequireApprovedReviewOnPagePublish } from "./RequireApprovedReviewOnPagePublish.js";
import { BlockPageMoveWhileInReview } from "./BlockPageMoveWhileInReview.js";

/**
 * `wb.page` adapter rules on the Website Builder page events (R52). Revision create and the save
 * block for pages are the single CMS handlers (R51).
 */
export const WbHooksFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Hooks",
    register(container) {
        container.register(RequireApprovedReviewOnPagePublish);
        container.register(BlockPageMoveWhileInReview);
    }
});
