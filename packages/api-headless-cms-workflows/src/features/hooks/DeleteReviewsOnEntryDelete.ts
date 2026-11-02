import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";

/**
 * Deletes every review of a permanently deleted CMS entry with its assignment records (spec 9.3,
 * R56). Trashing keeps them: the entry can be restored. A failure (a failed result or a throw) is logged, not thrown: the entry
 * is already deleted, and a throw would make the use case report a failure and publish its error
 * event for a delete that happened (R81). The reviews then stay orphaned (A34).
 */
class DeleteReviewsOnEntryDeleteImpl implements EntryAfterDeleteEventHandler.Interface {
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;
        if (!permanent) {
            return;
        }
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        try {
            const deleted = await this.deleteTargetReviews.execute({
                model: namespace,
                targetIds: [entry.entryId]
            });
            if (deleted.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(deleted.error) ? deleted.error.source : deleted.error,
                        model: namespace,
                        targetId: entry.entryId
                    },
                    "Could not delete the reviews of a deleted entry; they are left orphaned."
                );
            }
        } catch (error) {
            this.logger.error(
                { err: error, model: namespace, targetId: entry.entryId },
                "Could not delete the reviews of a deleted entry; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnEntryDelete = EntryAfterDeleteEventHandler.createImplementation({
    implementation: DeleteReviewsOnEntryDeleteImpl,
    dependencies: [DeleteTargetReviewsUseCase, Logger]
});
