import { createFeature } from "@webiny/feature/api";
import { ExternalIdpUserSyncHandler } from "./ExternalIdpUserSyncHandler.js";

export const ExternalIdpUserSyncFeature = createFeature({
    name: "ExternalIdpUserSync",
    register(container) {
        container.register(ExternalIdpUserSyncHandler);
    }
});
