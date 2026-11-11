import { createFeature } from "@webiny/feature/api";
import SyncTenantOnEntryUpdateHandler from "./SyncTenantOnEntryUpdateHandler.js";

export const SyncTenantOnEntryUpdateFeature = createFeature({
    name: "SyncTenantOnEntryUpdate",
    register(container) {
        // Register the event handler
        container.register(SyncTenantOnEntryUpdateHandler);
    }
});
