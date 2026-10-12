import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";

/**
 * Move rule of the `cms.*` adapter applied to updates (D84, R55, A24). An update can relocate the
 * entry (`UpdateEntryDataFactory` sets `location` from `wbyAco_location`) without publishing
 * `EntryBeforeMove`, and the save block only checks the updated revision. So when an update changes
 * the folder of an entry of a bound model with a review namespace (CMS entries and pages, R51), any in-progress review of the entry (any
 * revision) refuses it like a move. Updates that keep the folder are left to the save block.
 */
class BlockFolderChangeWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private namespaces: CmsEntryReviewNamespace.Interface[],
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        const { model, entry, original } = event.payload;
        if (entry.location?.folderId === original.location?.folderId) {
            return;
        }
        // The last registered non-null namespace for the model wins (R51).
        let namespace: string | null = null;
        for (const candidate of [...this.namespaces].reverse()) {
            const resolved = candidate.resolve(model);
            if (resolved) {
                namespace = resolved;
                break;
            }
        }
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
            model: namespace,
            targetRevisionId: inProgress.targetRevisionId,
            reviewState: inProgress.state,
            action: "move"
        });
    }
}

export const BlockFolderChangeWhileInReview = EntryBeforeUpdateEventHandler.createImplementation({
    implementation: BlockFolderChangeWhileInReviewImpl,
    dependencies: [
        [CmsEntryReviewNamespace, { multiple: true }],
        GetBoundWorkflowUseCase,
        ListTargetReviewsUseCase
    ]
});
