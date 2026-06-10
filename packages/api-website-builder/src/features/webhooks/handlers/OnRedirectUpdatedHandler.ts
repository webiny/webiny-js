import { RedirectAfterUpdateEventHandler } from "~/features/redirects/UpdateRedirect/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnRedirectUpdatedHandlerImpl implements RedirectAfterUpdateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: RedirectAfterUpdateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbRedirectUpdated, {
            redirect: event.payload.redirect,
            original: event.payload.original
        });
    }
}

export const OnRedirectUpdatedHandler = RedirectAfterUpdateEventHandler.createImplementation({
    implementation: OnRedirectUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
