import { LayoutAfterTranslateEventHandler } from "~/features/layouts/TranslateLayout/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

// A language version is a new layout too.
class OnLayoutTranslatedHandlerImpl implements LayoutAfterTranslateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: LayoutAfterTranslateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbLayoutCreated, {
            layout: event.payload.layout
        });
    }
}

export const OnLayoutTranslatedHandler = LayoutAfterTranslateEventHandler.createImplementation({
    implementation: OnLayoutTranslatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
