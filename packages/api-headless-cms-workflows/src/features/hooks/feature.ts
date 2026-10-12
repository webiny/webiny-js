import { createFeature } from "@webiny/feature/api";
import { NullReviewStateOnRevisionCreate } from "./NullReviewStateOnRevisionCreate.js";
import { BlockUpdateWhileInReview } from "./BlockUpdateWhileInReview.js";
import { RequireApprovedReviewOnPublish } from "./RequireApprovedReviewOnPublish.js";
import { BlockMoveWhileInReview } from "./BlockMoveWhileInReview.js";
import { BlockDeleteWhileInReview } from "./BlockDeleteWhileInReview.js";
import { BlockRevisionDeleteWhileInReview } from "./BlockRevisionDeleteWhileInReview.js";
import { BlockDeleteMultipleWhileInReview } from "./BlockDeleteMultipleWhileInReview.js";
import { DeleteReviewsOnEntryDelete } from "./DeleteReviewsOnEntryDelete.js";
import { DeleteReviewsOnRevisionDelete } from "./DeleteReviewsOnRevisionDelete.js";
import { DeleteReviewsOnEntriesDeleteMultiple } from "./DeleteReviewsOnEntriesDeleteMultiple.js";
import { DeleteModelBoundToWorkflowDecorator } from "./DeleteModelBoundToWorkflowDecorator.js";
import { FullyDeleteModelBoundToWorkflowDecorator } from "./FullyDeleteModelBoundToWorkflowDecorator.js";

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

        // Trash and delete (D134, R73) and review cleanup after a permanent delete (R56, R81)
        container.register(BlockDeleteWhileInReview);
        container.register(BlockRevisionDeleteWhileInReview);
        container.register(BlockDeleteMultipleWhileInReview);
        container.register(DeleteReviewsOnEntryDelete);
        container.register(DeleteReviewsOnRevisionDelete);
        container.register(DeleteReviewsOnEntriesDeleteMultiple);

        // Model delete blocks (D64, D134 point 4); the use-case decorator runs before the CMS's
        // own DeleteModel decorators, the task decorator before the task is triggered.
        container.registerDecorator(DeleteModelBoundToWorkflowDecorator);
        container.registerDecorator(FullyDeleteModelBoundToWorkflowDecorator);
    }
});
