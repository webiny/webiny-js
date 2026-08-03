import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { ThemeAfterActivateEventHandler } from "~/features/ActivateTheme/index.js";
import { ThemeWebhookEvent } from "../constants.js";
import { toActivationPayload } from "../payload.js";

/**
 * Activation fires the webhook a customer wires to the SDK's revalidation handler.
 *
 * Revalidation downstream is asynchronous, so activation is near-instant rather than atomic and a
 * page mid-flight can briefly serve the previous theme. A customer who never wires the webhook
 * still gets correct behaviour on the next revalidation — the integration is recommended, not
 * required. See the design brief, section 6.4.
 */
class OnThemeActivatedHandlerImpl implements ThemeAfterActivateEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: ThemeAfterActivateEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(
            ThemeWebhookEvent.ThemeActivated,
            toActivationPayload(event.payload.theme, event.payload.previous)
        );
    }
}

export const OnThemeActivatedHandler = ThemeAfterActivateEventHandler.createImplementation({
    implementation: OnThemeActivatedHandlerImpl,
    dependencies: [WebhookDispatcher]
});
