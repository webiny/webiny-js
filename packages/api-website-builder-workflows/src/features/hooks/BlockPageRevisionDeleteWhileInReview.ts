import { PageRevisionBeforeDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/*
 * Deleting one revision of a page is refused while that revision's review is in progress (D134,
 * R73, R235). Deleting the only revision also publishes the page-delete event, which
 * `BlockPageDeleteWhileInReview` guards with the same error.
 *
 * The CMS revision hooks ignore the private page model (A87), so only this one runs for pages.
 */
class BlockPageRevisionDeleteWhileInReviewImpl
    implements PageRevisionBeforeDeleteEventHandler.Interface
{
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageRevisionBeforeDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        const bound = await this.getBoundWorkflow.execute({ model: WB_PAGE_NAMESPACE });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: page.entryId
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value.filter(review => {
            return review.state === "inProgress" && review.targetRevisionId === page.id;
        });
        if (inProgress.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: WB_PAGE_NAMESPACE,
            action: "delete",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockPageRevisionDeleteWhileInReview =
    PageRevisionBeforeDeleteEventHandler.createImplementation({
        implementation: BlockPageRevisionDeleteWhileInReviewImpl,
        dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    });
