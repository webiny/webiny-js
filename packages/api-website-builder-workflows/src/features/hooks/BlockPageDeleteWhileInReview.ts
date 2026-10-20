import { PageBeforeDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Deleting a page from the trash is refused while a review is in progress (D134, R73). A page
 * cannot reach the trash with one (`BlockPageTrashWhileInReview`), so this only guards races.
 *
 * Pages are private: they are not exposed through CMS GraphQL, so only programmatic CMS calls on
 * the page model bypass this rule.
 */
class BlockPageDeleteWhileInReviewImpl implements PageBeforeDeleteEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageBeforeDeleteEventHandler.Event): Promise<void> {
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
        const inProgress = reviews.value.filter(review => review.state === "inProgress");
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

export const BlockPageDeleteWhileInReview = PageBeforeDeleteEventHandler.createImplementation({
    implementation: BlockPageDeleteWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
