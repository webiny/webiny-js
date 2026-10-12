import { EntryBeforeDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * `deleteMultiple` (permanent, up to 50 entries) is refused while any entry it would delete has an
 * in-progress review (D134, R73). Only the entries the caller may access are considered, with the
 * same check `DeleteMultipleEntriesUseCase` applies, so the error never names a review of content
 * the caller cannot see. Bound models only; the binding is looked up once, the reviews of the
 * entries in parallel.
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

        // One lookup per entry, in parallel; any failure rejects, so the delete is refused.
        const inProgress = await Promise.all(
            entries.map(async entry => {
                if (!(await this.accessControl.canAccessEntry({ model, entry }))) {
                    return [];
                }
                const reviews = await this.listTargetReviews.execute({
                    model: namespace,
                    targetId: entry.entryId
                });
                if (reviews.isFail()) {
                    throw reviews.error;
                }
                return reviews.value.filter(review => review.state === "inProgress");
            })
        );
        const blocking = inProgress.flat().map(toBlockingReview);
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
