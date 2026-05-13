import { PageAfterUnpublishEventHandler } from "~/features/pages/UnpublishPage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnPageUnpublishedHandlerImpl implements PageAfterUnpublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: PageAfterUnpublishEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.page.unpublished", { page: event.payload.page });
    }
}

export const OnPageUnpublishedHandler = PageAfterUnpublishEventHandler.createImplementation({
    implementation: OnPageUnpublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
