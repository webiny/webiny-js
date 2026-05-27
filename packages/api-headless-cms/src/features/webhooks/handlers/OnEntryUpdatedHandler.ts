import { EntryAfterUpdateEventHandler } from "~/features/contentEntry/UpdateEntry/events.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnEntryUpdatedHandlerImpl implements EntryAfterUpdateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: EntryAfterUpdateEventHandler.Event): Promise<void> {
        const { entry, model, original } = event.payload;
        await this.dispatcher.dispatch(`cms.entry.${model.modelId}.updated`, { entry, original });
    }
}

export const OnEntryUpdatedHandler = EntryAfterUpdateEventHandler.createImplementation({
    implementation: OnEntryUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
