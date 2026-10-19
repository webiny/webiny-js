import { createFeature } from "@webiny/feature/api";
import { RequireApprovedReviewOnPagePublish } from "./RequireApprovedReviewOnPagePublish.js";
import { BlockPageMoveWhileInReview } from "./BlockPageMoveWhileInReview.js";
import { BlockPageTrashWhileInReview } from "./BlockPageTrashWhileInReview.js";
import { BlockPageDeleteWhileInReview } from "./BlockPageDeleteWhileInReview.js";
import { DeleteReviewsOnPageDelete } from "./DeleteReviewsOnPageDelete.js";
import { BlockPageRevisionDeleteWhileInReview } from "./BlockPageRevisionDeleteWhileInReview.js";
import { DeleteReviewsOnPageRevisionDelete } from "./DeleteReviewsOnPageRevisionDelete.js";
import { BlockPageUpdateWhileInReview } from "./BlockPageUpdateWhileInReview.js";
import { BlockPageFolderChangeWhileInReview } from "./BlockPageFolderChangeWhileInReview.js";
import { NullReviewStateOnPageRevisionCreate } from "./NullReviewStateOnPageRevisionCreate.js";

/**
 * `wb.page` adapter rules on the Website Builder page events (R52). The page model publishes no
 * CMS entry events, so every page rule, the save block and the revision-create reset included,
 * listens here.
 */
export const WbHooksFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Hooks",
    register(container) {
        container.register(RequireApprovedReviewOnPagePublish);
        container.register(BlockPageMoveWhileInReview);
        // The save block (R54), its folder-change twin (D84) and the new-revision reset (D59).
        container.register(BlockPageUpdateWhileInReview);
        container.register(BlockPageFolderChangeWhileInReview);
        container.register(NullReviewStateOnPageRevisionCreate);
        // Trash and delete (D134, R73) and review cleanup after a page delete (R56, R81).
        container.register(BlockPageTrashWhileInReview);
        container.register(BlockPageDeleteWhileInReview);
        container.register(DeleteReviewsOnPageDelete);
        // The page revision delete (R235): the same block and cleanup for one revision.
        container.register(BlockPageRevisionDeleteWhileInReview);
        container.register(DeleteReviewsOnPageRevisionDelete);
    }
});
