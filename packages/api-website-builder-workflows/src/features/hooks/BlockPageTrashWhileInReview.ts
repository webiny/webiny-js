import { PageBeforeTrashEventHandler } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Trashing a page is refused while any of its revisions has an in-progress review (D134, R73).
 * The admin confirms by calling `CancelWebsiteBuilderPageReviewsForDelete` and trashing again.
 * Only with a pages workflow bound; lookup failures refuse.
 *
 * Pages are private: they are not exposed through CMS GraphQL, so only programmatic CMS calls on
 * the page model bypass this rule.
 */
class BlockPageTrashWhileInReviewImpl implements PageBeforeTrashEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageBeforeTrashEventHandler.Event): Promise<void> {
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
            action: "trash",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockPageTrashWhileInReview = PageBeforeTrashEventHandler.createImplementation({
    implementation: BlockPageTrashWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
