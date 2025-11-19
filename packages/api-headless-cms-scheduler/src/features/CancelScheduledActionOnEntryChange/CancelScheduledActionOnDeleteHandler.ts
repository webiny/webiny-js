import { EntryAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events";
import { CancelScheduledEntryActionUseCase } from "../CancelScheduledEntryAction/index.js";

/**
 * Cancels scheduled actions when an entry is deleted
 *
 * When a user deletes an entry, any scheduled publish/unpublish
 * actions for that entry should be cancelled since the entry
 * no longer exists.
 */
class CancelScheduledActionOnDeleteHandlerImpl implements EntryAfterDeleteHandler.Interface {
    constructor(private cancelScheduledEntryAction: CancelScheduledEntryActionUseCase.Interface) {}

    async handle(event: EntryAfterDeleteHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Skip private models
        if (model.isPrivate) {
            return;
        }

        try {
            await this.cancelScheduledEntryAction.execute({
                modelId: model.modelId,
                targetId: entry.id
            });
        } catch (error) {
            // Silently ignore errors - this is non-critical cleanup
            // The entry was deleted successfully, cancelling scheduled actions is best-effort
        }
    }
}

export const CancelScheduledActionOnDeleteHandler = EntryAfterDeleteHandler.createImplementation({
    implementation: CancelScheduledActionOnDeleteHandlerImpl,
    dependencies: [CancelScheduledEntryActionUseCase]
});
