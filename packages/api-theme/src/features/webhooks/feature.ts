import { createFeature } from "@webiny/feature/api";
import { ThemeWebhookFactory } from "./ThemeWebhookEventProvider.js";
import { OnThemeCreatedHandler } from "./handlers/OnThemeCreatedHandler.js";
import { OnThemeUpdatedHandler } from "./handlers/OnThemeUpdatedHandler.js";
import { OnThemeDeletedHandler } from "./handlers/OnThemeDeletedHandler.js";
import { OnThemePublishedHandler } from "./handlers/OnThemePublishedHandler.js";
import { OnThemeActivatedHandler } from "./handlers/OnThemeActivatedHandler.js";
import { OnThemeDeactivatedHandler } from "./handlers/OnThemeDeactivatedHandler.js";

export const ThemeWebhooksFeature = createFeature({
    name: "Theme/Webhooks",
    register(container) {
        container.register(ThemeWebhookFactory).inSingletonScope();
        container.register(OnThemeCreatedHandler);
        container.register(OnThemeUpdatedHandler);
        container.register(OnThemeDeletedHandler);
        container.register(OnThemePublishedHandler);
        container.register(OnThemeActivatedHandler);
        container.register(OnThemeDeactivatedHandler);
    }
});
