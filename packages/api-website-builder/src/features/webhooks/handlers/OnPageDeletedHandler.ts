import { PageAfterDeleteEventHandler } from "~/features/pages/DeletePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnPageDeletedHandlerImpl implements PageAfterDeleteEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbPageDeleted, { page: event.payload.page });
    }
}

export const OnPageDeletedHandler = PageAfterDeleteEventHandler.createImplementation({
    implementation: OnPageDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
