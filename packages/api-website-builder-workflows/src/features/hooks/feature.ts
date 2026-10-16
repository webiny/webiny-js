import { createFeature } from "@webiny/feature/api";
import { RequireApprovedReviewOnPagePublish } from "./RequireApprovedReviewOnPagePublish.js";
import { BlockPageMoveWhileInReview } from "./BlockPageMoveWhileInReview.js";
import { BlockPageTrashWhileInReview } from "./BlockPageTrashWhileInReview.js";
import { BlockPageDeleteWhileInReview } from "./BlockPageDeleteWhileInReview.js";
import { DeleteReviewsOnPageDelete } from "./DeleteReviewsOnPageDelete.js";
import { BlockPageRevisionDeleteWhileInReview } from "./BlockPageRevisionDeleteWhileInReview.js";
import { DeleteReviewsOnPageRevisionDelete } from "./DeleteReviewsOnPageRevisionDelete.js";

/**
 * `wb.page` adapter rules on the Website Builder page events (R52). Revision create and the save
 * block for pages are the single CMS handlers (R51).
 */
export const WbHooksFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Hooks",
    register(container) {
        container.register(RequireApprovedReviewOnPagePublish);
        container.register(BlockPageMoveWhileInReview);
        // Trash and delete (D134, R73) and review cleanup after a page delete (R56, R81).
        container.register(BlockPageTrashWhileInReview);
        container.register(BlockPageDeleteWhileInReview);
        container.register(DeleteReviewsOnPageDelete);
        // The page revision delete (R235): the same block and cleanup for one revision.
        container.register(BlockPageRevisionDeleteWhileInReview);
        container.register(DeleteReviewsOnPageRevisionDelete);
    }
});
