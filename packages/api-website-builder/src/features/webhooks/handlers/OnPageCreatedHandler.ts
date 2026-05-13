import { PageAfterCreateEventHandler } from "~/features/pages/CreatePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnPageCreatedHandlerImpl implements PageAfterCreateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: PageAfterCreateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.page.created", { page: event.payload.page });
    }
}

export const OnPageCreatedHandler = PageAfterCreateEventHandler.createImplementation({
    implementation: OnPageCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
