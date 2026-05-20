import { createFeature } from "@webiny/feature/api";
import { CmsWebhookFactory } from "./CmsWebhookFactory.js";
import { OnEntryCreatedHandler } from "./handlers/OnEntryCreatedHandler.js";
import { OnEntryUpdatedHandler } from "./handlers/OnEntryUpdatedHandler.js";
import { OnEntryDeletedHandler } from "./handlers/OnEntryDeletedHandler.js";
import { OnEntryPublishedHandler } from "./handlers/OnEntryPublishedHandler.js";
import { OnEntryUnpublishedHandler } from "./handlers/OnEntryUnpublishedHandler.js";
import { OnEntryTrashedHandler } from "./handlers/OnEntryTrashedHandler.js";
import { OnEntryRestoredHandler } from "./handlers/OnEntryRestoredHandler.js";

export const CmsWebhooksFeature = createFeature({
    name: "CmsWebhooks",
    register(container) {
        container.register(CmsWebhookFactory).inSingletonScope();
        container.register(OnEntryCreatedHandler);
        container.register(OnEntryUpdatedHandler);
        container.register(OnEntryDeletedHandler);
        container.register(OnEntryPublishedHandler);
        container.register(OnEntryUnpublishedHandler);
        container.register(OnEntryTrashedHandler);
        container.register(OnEntryRestoredHandler);
    }
});
