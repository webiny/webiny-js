import { EntryAfterPublishHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events";
import { CancelScheduledEntryActionUseCase } from "../CancelScheduledEntryAction/index.js";

/**
 * Cancels scheduled actions when an entry is manually published
 *
 * When a user manually publishes an entry, any scheduled publish/unpublish
 * actions for that entry should be cancelled since the manual action
 * takes precedence.
 */
class CancelScheduledActionOnPublishHandlerImpl implements EntryAfterPublishHandler.Interface {
    constructor(private cancelScheduledEntryAction: CancelScheduledEntryActionUseCase.Interface) {}

    async handle(event: EntryAfterPublishHandler.Event): Promise<void> {
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
        } catch {
            // Silently ignore errors - this is non-critical cleanup
            // The entry was published successfully, cancelling scheduled actions is best-effort
        }
    }
}

export const CancelScheduledActionOnPublishHandler = EntryAfterPublishHandler.createImplementation({
    implementation: CancelScheduledActionOnPublishHandlerImpl,
    dependencies: [CancelScheduledEntryActionUseCase]
});
