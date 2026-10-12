import { EntryBeforeDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * `deleteMultiple` (permanent, up to 50 entries) is refused while any entry it would delete has an
 * in-progress review (D134, R73). Only the entries the caller may access are considered, with the
 * same check `DeleteMultipleEntriesUseCase` applies, so the error never names a review of content
 * the caller cannot see. Bound models only; the binding is looked up once.
 */
class BlockDeleteMultipleWhileInReviewImpl
    implements EntryBeforeDeleteMultipleEventHandler.Interface
{
    public constructor(
        private accessControl: AccessControl.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeDeleteMultipleEventHandler.Event): Promise<void> {
        const { model, entries } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const bound = await this.getBoundWorkflow.execute({ model: namespace });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const blocking: WorkflowBlockingReview[] = [];
        for (const entry of entries) {
            if (!(await this.accessControl.canAccessEntry({ model, entry }))) {
                continue;
            }
            const reviews = await this.listTargetReviews.execute({
                model: namespace,
                targetId: entry.entryId
            });
            if (reviews.isFail()) {
                throw reviews.error;
            }
            for (const review of reviews.value) {
                if (review.state === "inProgress") {
                    blocking.push(toBlockingReview(review));
                }
            }
        }
        if (blocking.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: namespace,
            action: "delete",
            reviews: blocking
        });
    }
}

export const BlockDeleteMultipleWhileInReview =
    EntryBeforeDeleteMultipleEventHandler.createImplementation({
        implementation: BlockDeleteMultipleWhileInReviewImpl,
        dependencies: [AccessControl, GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    });
