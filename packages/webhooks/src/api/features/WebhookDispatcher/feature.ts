import { createFeature } from "@webiny/feature/api";
import { WebhookDispatcherImpl } from "./WebhookDispatcherImpl.js";

export const WebhookDispatcherFeature = createFeature({
    name: "WebhookDispatcher",
    register(container) {
        container.register(WebhookDispatcherImpl).inSingletonScope();
    }
});
