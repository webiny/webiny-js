import { LayoutAfterDeleteEventHandler } from "~/features/layouts/DeleteLayout/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnLayoutDeletedHandlerImpl implements LayoutAfterDeleteEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: LayoutAfterDeleteEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbLayoutDeleted, {
            layout: event.payload.layout
        });
    }
}

export const OnLayoutDeletedHandler = LayoutAfterDeleteEventHandler.createImplementation({
    implementation: OnLayoutDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
