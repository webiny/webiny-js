import { createFeature } from "@webiny/feature/api";
import { OnLayoutCreatedHandler } from "./OnLayoutCreatedHandler.js";
import { OnLayoutTranslatedHandler } from "./OnLayoutTranslatedHandler.js";
import { OnLayoutUpdatedHandler } from "./OnLayoutUpdatedHandler.js";
import { OnLayoutPublishedHandler } from "./OnLayoutPublishedHandler.js";
import { OnLayoutUnpublishedHandler } from "./OnLayoutUnpublishedHandler.js";
import { OnLayoutDeletedHandler } from "./OnLayoutDeletedHandler.js";

export const NotifyLayoutChangesFeature = createFeature({
    name: "WebsiteBuilder/Webhooks/NotifyLayoutChanges",
    register(container) {
        container.register(OnLayoutCreatedHandler);
        container.register(OnLayoutTranslatedHandler);
        container.register(OnLayoutUpdatedHandler);
        container.register(OnLayoutPublishedHandler);
        container.register(OnLayoutUnpublishedHandler);
        container.register(OnLayoutDeletedHandler);
    }
});
