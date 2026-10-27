import { EntryRevisionBeforeDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Deleting one revision is refused while that revision's review is in progress (D134, R73).
 * Deleting the only revision deletes the entry, which `BlockDeleteWhileInReview` guards.
 */
class BlockRevisionDeleteWhileInReviewImpl
    implements EntryRevisionBeforeDeleteEventHandler.Interface
{
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryRevisionBeforeDeleteEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;
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

        const reviews = await this.listTargetReviews.execute({
            model: namespace,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            state: "inProgress"
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value;
        if (inProgress.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: namespace,
            action: "delete",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockRevisionDeleteWhileInReview =
    EntryRevisionBeforeDeleteEventHandler.createImplementation({
        implementation: BlockRevisionDeleteWhileInReviewImpl,
        dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    });
