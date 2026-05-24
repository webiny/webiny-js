import { EntryAfterRestoreFromBinEventHandler } from "~/features/contentEntry/RestoreEntryFromBin/events.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnEntryRestoredHandlerImpl implements EntryAfterRestoreFromBinEventHandler.Interface {
    constructor(private readonly dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: EntryAfterRestoreFromBinEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;
        await this.dispatcher.dispatch(`cms.entry.${model.modelId}.restored`, { entry });
    }
}

export const OnEntryRestoredHandler = EntryAfterRestoreFromBinEventHandler.createImplementation({
    implementation: OnEntryRestoredHandlerImpl,
    dependencies: [WebhookDispatcher]
});
