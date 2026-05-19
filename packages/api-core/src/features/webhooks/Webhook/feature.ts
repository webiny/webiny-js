import { createFeature } from "@webiny/feature/api/index.js";
import { WebhookProvider } from "./WebhookProvider.js";

export const WebhookProviderFeature = createFeature({
    name: "WebhookProviderFeature",
    register(container) {
        container.register(WebhookProvider).inSingletonScope();
    }
});
