import { PageAfterPublishEventHandler } from "~/features/pages/PublishPage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnPagePublishedHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbPagePublished, { page: event.payload.page });
    }
}

export const OnPagePublishedHandler = PageAfterPublishEventHandler.createImplementation({
    implementation: OnPagePublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
