import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { findBoundWorkflow } from "./findBoundWorkflow.js";
import { listInProgressTargetReviews } from "./listInProgressTargetReviews.js";

/**
 * Move rule of the `cms.*` adapter applied to updates (D84, R55, A24). An update can relocate the
 * entry (`UpdateEntryDataFactory` sets `location` from `wbyAco_location`) without publishing
 * `EntryBeforeMove`, and the save block only checks the updated revision. So when an update changes
 * the folder of an entry of a bound public model, any in-progress review of the entry (any
 * revision) refuses it like a move. Updates that keep the folder are left to the save block.
 */
class BlockFolderChangeWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        const { model, entry, original } = event.payload;
        if (entry.location?.folderId === original.location?.folderId) {
            return;
        }
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const workflow = await findBoundWorkflow(this.getBoundWorkflow, namespace);
        if (!workflow) {
            return;
        }

        const [inProgress] = await listInProgressTargetReviews(this.listTargetReviews, {
            model: namespace,
            targetId: original.entryId
        });
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
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
