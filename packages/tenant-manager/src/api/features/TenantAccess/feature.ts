import { createFeature } from "@webiny/feature/api";
import TenantAccess from "./TenantAccess.js";

export const TenantAccessFeature = createFeature({
    name: "TenantManagerTenantAccess",
    register(container) {
        container.register(TenantAccess);
    }
});
