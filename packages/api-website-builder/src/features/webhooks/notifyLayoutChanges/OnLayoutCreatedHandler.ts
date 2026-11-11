import { LayoutAfterCreateEventHandler } from "~/features/layouts/CreateLayout/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnLayoutCreatedHandlerImpl implements LayoutAfterCreateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: LayoutAfterCreateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbLayoutCreated, {
            layout: event.payload.layout
        });
    }
}

export const OnLayoutCreatedHandler = LayoutAfterCreateEventHandler.createImplementation({
    implementation: OnLayoutCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
