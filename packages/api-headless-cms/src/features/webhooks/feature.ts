import { createFeature } from "@webiny/feature/api";
import { WebhookEventProvider } from "./CmsWebhookEventProvider.js";
import { OnEntryCreatedHandler } from "./handlers/OnEntryCreatedHandler.js";
import { OnEntryUpdatedHandler } from "./handlers/OnEntryUpdatedHandler.js";
import { OnEntryDeletedHandler } from "./handlers/OnEntryDeletedHandler.js";
import { OnEntryPublishedHandler } from "./handlers/OnEntryPublishedHandler.js";
import { OnEntryUnpublishedHandler } from "./handlers/OnEntryUnpublishedHandler.js";

export const CmsWebhooksFeature = createFeature({
    name: "CmsWebhooks",
    register(container) {
        container.register(WebhookEventProvider).inSingletonScope();
        container.register(OnEntryCreatedHandler);
        container.register(OnEntryUpdatedHandler);
        container.register(OnEntryDeletedHandler);
        container.register(OnEntryPublishedHandler);
        container.register(OnEntryUnpublishedHandler);
    }
});
