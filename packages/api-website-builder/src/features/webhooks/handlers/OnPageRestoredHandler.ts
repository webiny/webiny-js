import { PageAfterRestoreEventHandler } from "~/features/pages/RestorePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnPageRestoredHandlerImpl implements PageAfterRestoreEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: PageAfterRestoreEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.page.restored", { page: event.payload.page });
    }
}

export const OnPageRestoredHandler = PageAfterRestoreEventHandler.createImplementation({
    implementation: OnPageRestoredHandlerImpl,
    dependencies: [WebhookDispatcher]
});
