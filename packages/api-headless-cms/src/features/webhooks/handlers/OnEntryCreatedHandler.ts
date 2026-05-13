import { EntryAfterCreateEventHandler } from "~/features/contentEntry/CreateEntry/events.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnEntryCreatedHandlerImpl implements EntryAfterCreateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: EntryAfterCreateEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;
        await this.dispatcher.dispatch(`cms.entry.${model.modelId}.created`, { entry });
    }
}

export const OnEntryCreatedHandler = EntryAfterCreateEventHandler.createImplementation({
    implementation: OnEntryCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
