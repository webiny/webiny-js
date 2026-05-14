import { RedirectAfterCreateEventHandler } from "~/features/redirects/CreateRedirect/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnRedirectCreatedHandlerImpl implements RedirectAfterCreateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: RedirectAfterCreateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbRedirectCreated, {
            redirect: event.payload.redirect
        });
    }
}

export const OnRedirectCreatedHandler = RedirectAfterCreateEventHandler.createImplementation({
    implementation: OnRedirectCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
