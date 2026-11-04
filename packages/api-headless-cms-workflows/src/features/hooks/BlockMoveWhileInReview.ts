import { EntryBeforeMoveEventHandler } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Move rule of the `cms.*` adapter (spec 9.3, D84, R55): on a bound model, no folder move while
 * the review is in progress. The location belongs to the entry, not the revision, so any revision
 * in review blocks (A24). Approved, rejected and cancelled reviews do not block. Unbound models
 * never look up reviews; lookup failures on bound models block.
 */
class BlockMoveWhileInReviewImpl implements EntryBeforeMoveEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeMoveEventHandler.Event): Promise<void> {
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
            model: namespace,
            targetRevisionId: inProgress.targetRevisionId,
            reviewState: inProgress.state,
            action: "move"
        });
    }
}

export const BlockMoveWhileInReview = EntryBeforeMoveEventHandler.createImplementation({
    implementation: BlockMoveWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
