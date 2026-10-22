import { EntryAfterDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";

/**
 * Deletes the reviews of entries deleted by `deleteMultiple` (spec 9.3, R56), which publishes no
 * per-entry delete event. The event lists exactly the entries that were deleted (permanently),
 * so their reviews are deleted with one call (Q79). Failures, failed results and throws alike,
 * are logged, never thrown (R81).
 */
class DeleteReviewsOnEntriesDeleteMultipleImpl
    implements EntryAfterDeleteMultipleEventHandler.Interface
{
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: EntryAfterDeleteMultipleEventHandler.Event): Promise<void> {
        const { model, entries } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }
        const targetIds = [...new Set(entries.map(entry => entry.entryId))];
        if (targetIds.length === 0) {
            return;
        }

        try {
            const deleted = await this.deleteTargetReviews.execute({
                model: namespace,
                targetIds
            });
            if (deleted.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(deleted.error) ? deleted.error.source : deleted.error,
                        model: namespace,
                        targetIds
                    },
                    "Could not delete the reviews of deleted entries; they are left orphaned."
                );
            }
        } catch (error) {
            this.logger.error(
                { err: error, model: namespace, targetIds },
                "Could not delete the reviews of deleted entries; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnEntriesDeleteMultiple =
    EntryAfterDeleteMultipleEventHandler.createImplementation({
        implementation: DeleteReviewsOnEntriesDeleteMultipleImpl,
        dependencies: [DeleteTargetReviewsUseCase, Logger]
    });
