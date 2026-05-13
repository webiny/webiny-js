import { createFeature } from "@webiny/feature/api";
import { WbWebhookEventProvider } from "./WbWebhookEventProvider.js";
import { OnPageCreatedHandler } from "./handlers/OnPageCreatedHandler.js";
import { OnPageUpdatedHandler } from "./handlers/OnPageUpdatedHandler.js";
import { OnPagePublishedHandler } from "./handlers/OnPagePublishedHandler.js";
import { OnPageUnpublishedHandler } from "./handlers/OnPageUnpublishedHandler.js";
import { OnPageDeletedHandler } from "./handlers/OnPageDeletedHandler.js";
import { OnPageTrashedHandler } from "./handlers/OnPageTrashedHandler.js";
import { OnPageRestoredHandler } from "./handlers/OnPageRestoredHandler.js";
import { OnRedirectCreatedHandler } from "./handlers/OnRedirectCreatedHandler.js";
import { OnRedirectUpdatedHandler } from "./handlers/OnRedirectUpdatedHandler.js";
import { OnRedirectDeletedHandler } from "./handlers/OnRedirectDeletedHandler.js";

export const WbWebhooksFeature = createFeature({
    name: "WbWebhooks",
    register(container) {
        container.register(WbWebhookEventProvider).inSingletonScope();
        container.register(OnPageCreatedHandler);
        container.register(OnPageUpdatedHandler);
        container.register(OnPagePublishedHandler);
        container.register(OnPageUnpublishedHandler);
        container.register(OnPageDeletedHandler);
        container.register(OnPageTrashedHandler);
        container.register(OnPageRestoredHandler);
        container.register(OnRedirectCreatedHandler);
        container.register(OnRedirectUpdatedHandler);
        container.register(OnRedirectDeletedHandler);
    }
});
