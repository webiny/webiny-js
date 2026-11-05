import { LayoutAfterUpdateEventHandler } from "~/features/layouts/UpdateLayout/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnLayoutUpdatedHandlerImpl implements LayoutAfterUpdateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: LayoutAfterUpdateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbLayoutUpdated, {
            layout: event.payload.layout
        });
    }
}

export const OnLayoutUpdatedHandler = LayoutAfterUpdateEventHandler.createImplementation({
    implementation: OnLayoutUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
