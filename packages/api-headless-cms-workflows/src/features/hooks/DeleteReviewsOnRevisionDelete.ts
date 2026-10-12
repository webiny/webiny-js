import { EntryRevisionAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Deletes the reviews of a deleted CMS revision with their assignment records (spec 9.3, R56).
 * Deleting the last revision deletes the entry, which `DeleteReviewsOnEntryDelete` handles.
 * Failures, failed results and throws alike, are logged, never thrown (R81).
 */
class DeleteReviewsOnRevisionDeleteImpl implements EntryRevisionAfterDeleteEventHandler.Interface {
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: EntryRevisionAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        try {
            const deleted = await this.deleteTargetReviews.execute({
                model: namespace,
                targetId: entry.entryId,
                targetRevisionId: entry.id
            });
            if (deleted.isFail()) {
                this.logOrphaned(deleted.error, namespace, entry.id);
            }
        } catch (error) {
            this.logOrphaned(error, namespace, entry.id);
        }
    }

    private logOrphaned(error: unknown, model: string, targetRevisionId: string): void {
        this.logger.error(
            { error, model, targetRevisionId },
            "Could not delete the reviews of a deleted revision; they are left orphaned."
        );
    }
}

export const DeleteReviewsOnRevisionDelete =
    EntryRevisionAfterDeleteEventHandler.createImplementation({
        implementation: DeleteReviewsOnRevisionDeleteImpl,
        dependencies: [DeleteTargetReviewsUseCase, Logger]
    });
