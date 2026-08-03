import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { ThemeAfterDeactivateEventHandler } from "~/features/ActivateTheme/index.js";
import { ThemeWebhookEvent } from "../constants.js";

class OnThemeDeactivatedHandlerImpl implements ThemeAfterDeactivateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: ThemeAfterDeactivateEventHandler.Event): Promise<void> {
        const previous = event.payload.previous;

        await this.dispatcher.dispatch(ThemeWebhookEvent.ThemeDeactivated, {
            previous: previous ? { themeId: previous.entryId, version: previous.version } : null
        });
    }
}

export const OnThemeDeactivatedHandler = ThemeAfterDeactivateEventHandler.createImplementation({
    implementation: OnThemeDeactivatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
