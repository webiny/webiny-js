import { EntryBeforeDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Trash and permanent delete of a CMS entry are refused while any revision has an in-progress
 * review (D134, R73): `permanent: false` is the trash, `true` the delete. The admin confirms by
 * calling `CancelCmsEntryReviewsForDelete` and repeating the action. Bound models only.
 */
class BlockDeleteWhileInReviewImpl implements EntryBeforeDeleteEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;
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
            targetId: entry.entryId
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value.filter(review => review.state === "inProgress");
        if (inProgress.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: namespace,
            action: permanent ? "delete" : "trash",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockDeleteWhileInReview = EntryBeforeDeleteEventHandler.createImplementation({
    implementation: BlockDeleteWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
