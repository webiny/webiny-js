import { createFeature } from "@webiny/feature/api";
import DeleteTenantOnEntryDeleteHandler from "./DeleteTenantOnEntryDeleteHandler.js";

export const DeleteTenantOnEntryDeleteFeature = createFeature({
    name: "DeleteTenantOnEntryDelete",
    register(container) {
        // Register the event handler
        container.register(DeleteTenantOnEntryDeleteHandler);
    }
});
