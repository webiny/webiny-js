import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { ThemeAfterDeleteEventHandler } from "~/features/DeleteTheme/index.js";
import { ThemeWebhookEvent } from "../constants.js";
import { toThemePayload } from "../payload.js";

class OnThemeDeletedHandlerImpl implements ThemeAfterDeleteEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: ThemeAfterDeleteEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(
            ThemeWebhookEvent.ThemeDeleted,
            toThemePayload(event.payload.theme)
        );
    }
}

export const OnThemeDeletedHandler = ThemeAfterDeleteEventHandler.createImplementation({
    implementation: OnThemeDeletedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
