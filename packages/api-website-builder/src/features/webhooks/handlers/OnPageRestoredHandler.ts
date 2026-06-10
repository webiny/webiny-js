import { PageAfterRestoreEventHandler } from "~/features/pages/RestorePage/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnPageRestoredHandlerImpl implements PageAfterRestoreEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: PageAfterRestoreEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbPageRestored, { page: event.payload.page });
    }
}

export const OnPageRestoredHandler = PageAfterRestoreEventHandler.createImplementation({
    implementation: OnPageRestoredHandlerImpl,
    dependencies: [WebhookDispatcher]
});
