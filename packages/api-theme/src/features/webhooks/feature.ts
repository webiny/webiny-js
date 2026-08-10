import { createFeature } from "@webiny/feature/api";
import { ThemeWebhookFactory } from "./ThemeWebhookEventProvider.js";
import { OnThemeCreatedHandler } from "./handlers/OnThemeCreatedHandler.js";
import { OnThemeUpdatedHandler } from "./handlers/OnThemeUpdatedHandler.js";
import { OnThemeDeletedHandler } from "./handlers/OnThemeDeletedHandler.js";
import { OnThemePublishedHandler } from "./handlers/OnThemePublishedHandler.js";

/**
 * General theme lifecycle webhooks. The activation/deactivation webhooks were removed with the
 * delivery rework (C8): stable URLs make an activation webhook unnecessary, so activation now just
 * writes the active version and emits its domain event — nothing dispatches a webhook for it.
 */
export const ThemeWebhooksFeature = createFeature({
    name: "Theme/Webhooks",
    register(container) {
        container.register(ThemeWebhookFactory).inSingletonScope();
        container.register(OnThemeCreatedHandler);
        container.register(OnThemeUpdatedHandler);
        container.register(OnThemeDeletedHandler);
        container.register(OnThemePublishedHandler);
    }
});
