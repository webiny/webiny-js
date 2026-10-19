import { EntryAfterDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

/**
 * Deletes the reviews of entries deleted by `deleteMultiple` (spec 9.3, R56), which publishes no
 * per-entry delete event. The payload lists every requested entry, but the use case deletes only
 * those the caller may access, so each entry is confirmed gone (read as the system, including the
 * trash) before its reviews are deleted. Failures, failed results and throws alike, are logged
 * per entry, never thrown (R81).
 */
class DeleteReviewsOnEntriesDeleteMultipleImpl
    implements EntryAfterDeleteMultipleEventHandler.Interface
{
    public constructor(
        private identityContext: IdentityContext.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface,
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: EntryAfterDeleteMultipleEventHandler.Event): Promise<void> {
        const { model, entries } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        for (const entry of entries) {
            try {
                const latest = await this.identityContext.withoutAuthorization(() => {
                    return this.getLatestRevision.execute(model, { id: entry.entryId });
                });
                if (latest.isOk()) {
                    continue;
                }
                if (latest.error.code !== ENTRY_NOT_FOUND) {
                    this.logger.error(
                        {
                            err: hasErrorSource(latest.error) ? latest.error.source : latest.error,
                            model: namespace,
                            targetId: entry.entryId
                        },
                        "Could not confirm that an entry is deleted; its reviews are left orphaned."
                    );
                    continue;
                }

                const deleted = await this.deleteTargetReviews.execute({
                    model: namespace,
                    targetId: entry.entryId
                });
                if (deleted.isFail()) {
                    this.logger.error(
                        {
                            err: hasErrorSource(deleted.error)
                                ? deleted.error.source
                                : deleted.error,
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
}

export const DeleteReviewsOnEntriesDeleteMultiple =
    EntryAfterDeleteMultipleEventHandler.createImplementation({
        implementation: DeleteReviewsOnEntriesDeleteMultipleImpl,
        dependencies: [
            IdentityContext,
            GetLatestRevisionByEntryIdIncludingDeletedUseCase,
            DeleteTargetReviewsUseCase,
            Logger
        ]
    });
