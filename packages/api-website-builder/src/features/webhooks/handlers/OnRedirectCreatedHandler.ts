import { RedirectAfterCreateEventHandler } from "~/features/redirects/CreateRedirect/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnRedirectCreatedHandlerImpl implements RedirectAfterCreateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: RedirectAfterCreateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.redirect.created", {
            redirect: event.payload.redirect
        });
    }
}

export const OnRedirectCreatedHandler = RedirectAfterCreateEventHandler.createImplementation({
    implementation: OnRedirectCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
