import { EntryAfterUnpublishHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events";
import { CancelScheduledEntryActionUseCase } from "../CancelScheduledEntryAction/index.js";

/**
 * Cancels scheduled actions when an entry is manually unpublished
 *
 * When a user manually unpublishes an entry, any scheduled publish/unpublish
 * actions for that entry should be cancelled since the manual action
 * takes precedence.
 */
class CancelScheduledActionOnUnpublishHandlerImpl implements EntryAfterUnpublishHandler.Interface {
    constructor(private cancelScheduledEntryAction: CancelScheduledEntryActionUseCase.Interface) {}

    async handle(event: EntryAfterUnpublishHandler.Event): Promise<void> {
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
            // The entry was unpublished successfully, cancelling scheduled actions is best-effort
        }
    }
}

export const CancelScheduledActionOnUnpublishHandler = EntryAfterUnpublishHandler.createImplementation({
    implementation: CancelScheduledActionOnUnpublishHandlerImpl,
    dependencies: [CancelScheduledEntryActionUseCase]
});
