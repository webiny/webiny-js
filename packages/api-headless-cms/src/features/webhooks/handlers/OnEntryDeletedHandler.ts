import { EntryAfterDeleteEventHandler } from "~/features/contentEntry/DeleteEntry/events.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnEntryDeletedHandlerImpl implements EntryAfterDeleteEventHandler.Interface {
    constructor(private readonly dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { entry, model, permanent } = event.payload;
        if (!permanent) {
            return;
        }
        await this.dispatcher.dispatch(`cms.entry.${model.modelId}.deleted`, { entry });
    }
}

export const OnEntryDeletedHandler = EntryAfterDeleteEventHandler.createImplementation({
    implementation: OnEntryDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
