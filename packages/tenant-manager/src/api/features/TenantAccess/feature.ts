import { createFeature } from "@webiny/feature/api";
import TenantAccess from "./TenantAccess.js";
import TenantModelAccessGuard from "./TenantModelAccessGuard.js";

export const TenantAccessFeature = createFeature({
    name: "TenantManagerTenantAccess",
    register(container) {
        container.register(TenantAccess);

        // Accessing the tenant model and its entries requires the Tenant Manager permission
        container.register(TenantModelAccessGuard);
    }
});
