import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { ThemeAfterCreateEventHandler } from "~/features/CreateTheme/index.js";
import { ThemeWebhookEvent } from "../constants.js";
import { toThemePayload } from "../payload.js";

class OnThemeCreatedHandlerImpl implements ThemeAfterCreateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: ThemeAfterCreateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(
            ThemeWebhookEvent.ThemeCreated,
            toThemePayload(event.payload.theme)
        );
    }
}

export const OnThemeCreatedHandler = ThemeAfterCreateEventHandler.createImplementation({
    implementation: OnThemeCreatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
