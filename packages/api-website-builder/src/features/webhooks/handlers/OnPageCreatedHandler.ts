import { PageAfterCreateEventHandler } from "~/features/pages/CreatePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnPageCreatedHandlerImpl implements PageAfterCreateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: PageAfterCreateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbPageCreated, { page: event.payload.page });
    }
}

export const OnPageCreatedHandler = PageAfterCreateEventHandler.createImplementation({
    implementation: OnPageCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
