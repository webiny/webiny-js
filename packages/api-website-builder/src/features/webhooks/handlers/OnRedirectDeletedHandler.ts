import { RedirectAfterDeleteEventHandler } from "~/features/redirects/DeleteRedirect/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnRedirectDeletedHandlerImpl implements RedirectAfterDeleteEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: RedirectAfterDeleteEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbRedirectDeleted, {
            redirect: event.payload.redirect
        });
    }
}

export const OnRedirectDeletedHandler = RedirectAfterDeleteEventHandler.createImplementation({
    implementation: OnRedirectDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
