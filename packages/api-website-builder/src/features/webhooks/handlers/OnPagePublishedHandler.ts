import { PageAfterPublishEventHandler } from "~/features/pages/PublishPage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnPagePublishedHandlerImpl implements PageAfterPublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.page.published", { page: event.payload.page });
    }
}

export const OnPagePublishedHandler = PageAfterPublishEventHandler.createImplementation({
    implementation: OnPagePublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
