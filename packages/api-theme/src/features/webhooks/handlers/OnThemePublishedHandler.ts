import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { ThemeAfterPublishEventHandler } from "~/features/PublishTheme/index.js";
import { ThemeWebhookEvent } from "../constants.js";
import { toThemePayload } from "../payload.js";

class OnThemePublishedHandlerImpl implements ThemeAfterPublishEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: ThemeAfterPublishEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(ThemeWebhookEvent.ThemePublished, {
            theme: toThemePayload(event.payload.theme),
            warnings: event.payload.warnings
        });
    }
}

export const OnThemePublishedHandler = ThemeAfterPublishEventHandler.createImplementation({
    implementation: OnThemePublishedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
