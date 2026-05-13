import { PageAfterUpdateEventHandler } from "~/features/pages/UpdatePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnPageUpdatedHandlerImpl implements PageAfterUpdateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: PageAfterUpdateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.page.updated", { page: event.payload.page });
    }
}

export const OnPageUpdatedHandler = PageAfterUpdateEventHandler.createImplementation({
    implementation: OnPageUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
