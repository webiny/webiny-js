import { createFeature } from "@webiny/feature/api";
import { WebhookDispatcher } from "./WebhookDispatcher.js";

export const WebhookDispatcherFeature = createFeature({
    name: "WebhookDispatcher",
    register(container) {
        container.register(WebhookDispatcher).inSingletonScope();
    }
});
