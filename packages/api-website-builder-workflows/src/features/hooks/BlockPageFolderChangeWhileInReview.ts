import { PageBeforeUpdateEventHandler } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Move rule of the `wb.page` adapter applied to updates (D84, R55, A24). A page update can carry a
 * new `location`, which relocates the page without `MovePage`, and the save block only checks the
 * updated revision. So when an update changes the folder of a page while a pages workflow is
 * bound, any in-progress review of the page (any revision) refuses it like a move. Updates that
 * keep the folder are left to the save block. Lookup failures block.
 */
class BlockPageFolderChangeWhileInReviewImpl implements PageBeforeUpdateEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageBeforeUpdateEventHandler.Event): Promise<void> {
        const { original, input } = event.payload;
        const location = input.data.location;
        if (!location || location.folderId === original.location?.folderId) {
            return;
        }

        const bound = await this.getBoundWorkflow.execute({ model: WB_PAGE_NAMESPACE });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: original.entryId
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value.find(review => review.state === "inProgress");
        if (!inProgress) {
            return;
        }

        throw new ReviewTargetLockedError({
            reviewId: inProgress.id,
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: inProgress.targetRevisionId,
            reviewState: inProgress.state,
            action: "move"
        });
    }
}

export const BlockPageFolderChangeWhileInReview = PageBeforeUpdateEventHandler.createImplementation(
    {
        implementation: BlockPageFolderChangeWhileInReviewImpl,
        dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    }
);
