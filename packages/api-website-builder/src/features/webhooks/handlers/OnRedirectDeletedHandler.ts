import { RedirectAfterDeleteEventHandler } from "~/features/redirects/DeleteRedirect/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";

class OnRedirectDeletedHandlerImpl implements RedirectAfterDeleteEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    async handle(event: RedirectAfterDeleteEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch("wb.redirect.deleted", {
            redirect: event.payload.redirect
        });
    }
}

export const OnRedirectDeletedHandler = RedirectAfterDeleteEventHandler.createImplementation({
    implementation: OnRedirectDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
