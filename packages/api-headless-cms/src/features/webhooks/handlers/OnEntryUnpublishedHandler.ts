import { EntryAfterUnpublishEventHandler } from "~/features/contentEntry/UnpublishEntry/events.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnEntryUnpublishedHandlerImpl implements EntryAfterUnpublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: EntryAfterUnpublishEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;
        await this.dispatcher.dispatch(`cms.entry.${model.modelId}.unpublished`, { entry });
    }
}

export const OnEntryUnpublishedHandler = EntryAfterUnpublishEventHandler.createImplementation({
    implementation: OnEntryUnpublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
