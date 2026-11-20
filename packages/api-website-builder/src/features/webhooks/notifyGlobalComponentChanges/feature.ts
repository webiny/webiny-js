import { createFeature } from "@webiny/feature/api";
import { OnGlobalComponentSavedHandler } from "./OnGlobalComponentSavedHandler.js";

export const NotifyGlobalComponentChangesFeature = createFeature({
    name: "WebsiteBuilder/Webhooks/NotifyGlobalComponentChanges",
    register(container) {
        container.register(OnGlobalComponentSavedHandler);
    }
});
