import { createFeature } from "@webiny/feature/api";
import TenantModelExtension from "./TenantModelExtension.js";

export const TenantModelExtensionFeature = createFeature({
    name: "WebsiteBuilder/TenantModelExtension",
    register(container) {
        container.register(TenantModelExtension);
    }
});
