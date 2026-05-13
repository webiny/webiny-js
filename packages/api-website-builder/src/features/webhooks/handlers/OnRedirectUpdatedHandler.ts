import { RedirectAfterUpdateEventHandler } from "~/features/redirects/UpdateRedirect/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnRedirectUpdatedHandlerImpl implements RedirectAfterUpdateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: RedirectAfterUpdateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.redirect.updated", {
            redirect: event.payload.redirect
        });
    }
}

export const OnRedirectUpdatedHandler = RedirectAfterUpdateEventHandler.createImplementation({
    implementation: OnRedirectUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
