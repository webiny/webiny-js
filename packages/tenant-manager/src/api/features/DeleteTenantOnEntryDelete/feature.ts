import { createFeature } from "@webiny/feature/api";
import DeleteTenantOnEntryDeleteHandler from "./DeleteTenantOnEntryDeleteHandler.js";
import CheckTenantOnEntryBeforeDeleteHandler from "./CheckTenantOnEntryBeforeDeleteHandler.js";

export const DeleteTenantOnEntryDeleteFeature = createFeature({
    name: "DeleteTenantOnEntryDelete",
    register(container) {
        // Register the event handler
        container.register(CheckTenantOnEntryBeforeDeleteHandler);
        container.register(DeleteTenantOnEntryDeleteHandler);
    }
});
