import { PageAfterDeleteEventHandler } from "~/features/pages/DeletePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnPageDeletedHandlerImpl implements PageAfterDeleteEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.page.deleted", { page: event.payload.page });
    }
}

export const OnPageDeletedHandler = PageAfterDeleteEventHandler.createImplementation({
    implementation: OnPageDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
