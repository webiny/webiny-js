import { EntryAfterPublishEventHandler } from "~/features/contentEntry/PublishEntry/events.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnEntryPublishedHandlerImpl implements EntryAfterPublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: EntryAfterPublishEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;
        await this.dispatcher.dispatch(`cms.entry.${model.modelId}.published`, { entry });
    }
}

export const OnEntryPublishedHandler = EntryAfterPublishEventHandler.createImplementation({
    implementation: OnEntryPublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
