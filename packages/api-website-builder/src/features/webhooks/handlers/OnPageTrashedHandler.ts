import { PageAfterTrashEventHandler } from "~/features/pages/TrashPage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnPageTrashedHandlerImpl implements PageAfterTrashEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: PageAfterTrashEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbPageTrashed, { page: event.payload.page });
    }
}

export const OnPageTrashedHandler = PageAfterTrashEventHandler.createImplementation({
    implementation: OnPageTrashedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
