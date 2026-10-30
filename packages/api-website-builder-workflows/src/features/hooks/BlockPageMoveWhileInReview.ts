import { PageBeforeMoveEventHandler } from "@webiny/api-website-builder/features/pages/MovePage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Move rule of the `wb.page` adapter (spec 9.3, D84, R55). WB `MovePage` writes through
 * `MoveEntryRepository`, so no CMS move event fires; this listens to the page event. Only with a
 * pages workflow bound; any revision in review blocks (A24); lookup failures block.
 */
class BlockPageMoveWhileInReviewImpl implements PageBeforeMoveEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageBeforeMoveEventHandler.Event): Promise<void> {
        const { original } = event.payload;

        const bound = await this.getBoundWorkflow.execute({ model: WB_PAGE_NAMESPACE });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: original.entryId,
            state: "inProgress"
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const [inProgress] = reviews.value;
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

export const BlockPageMoveWhileInReview = PageBeforeMoveEventHandler.createImplementation({
    implementation: BlockPageMoveWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
