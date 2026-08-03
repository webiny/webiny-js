import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { ThemeAfterUpdateEventHandler } from "~/features/UpdateTheme/index.js";
import { ThemeWebhookEvent } from "../constants.js";
import { toThemePayload } from "../payload.js";

class OnThemeUpdatedHandlerImpl implements ThemeAfterUpdateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: ThemeAfterUpdateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(
            ThemeWebhookEvent.ThemeUpdated,
            toThemePayload(event.payload.theme)
        );
    }
}

export const OnThemeUpdatedHandler = ThemeAfterUpdateEventHandler.createImplementation({
    implementation: OnThemeUpdatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
