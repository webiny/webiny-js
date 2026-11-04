import { LayoutAfterPublishEventHandler } from "~/features/layouts/PublishLayout/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnLayoutPublishedHandlerImpl implements LayoutAfterPublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: LayoutAfterPublishEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbLayoutPublished, {
            layout: event.payload.layout
        });
    }
}

export const OnLayoutPublishedHandler = LayoutAfterPublishEventHandler.createImplementation({
    implementation: OnLayoutPublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
