import { LayoutAfterUnpublishEventHandler } from "~/features/layouts/UnpublishLayout/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnLayoutUnpublishedHandlerImpl implements LayoutAfterUnpublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: LayoutAfterUnpublishEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbLayoutUnpublished, {
            layout: event.payload.layout
        });
    }
}

export const OnLayoutUnpublishedHandler = LayoutAfterUnpublishEventHandler.createImplementation({
    implementation: OnLayoutUnpublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
