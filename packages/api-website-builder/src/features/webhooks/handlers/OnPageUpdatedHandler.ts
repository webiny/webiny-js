import { PageAfterUpdateEventHandler } from "~/features/pages/UpdatePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnPageUpdatedHandlerImpl implements PageAfterUpdateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: PageAfterUpdateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbPageUpdated, {
            page: event.payload.page,
            original: event.payload.original
        });
    }
}

export const OnPageUpdatedHandler = PageAfterUpdateEventHandler.createImplementation({
    implementation: OnPageUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
