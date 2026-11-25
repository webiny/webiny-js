import { createFeature } from "@webiny/feature/api";
import { TenantContext } from "./TenantContext.js";
import { ScopeTenant } from "~/features/tenancy/ScopeTenant/ScopeTenant.js";

export const TenantContextFeature = createFeature({
    name: "TenantContextFeature",
    register(container) {
        container.register(TenantContext).inSingletonScope();
        // The tenant storage operations take: the scope's, checked against what callers pass.
        container.register(ScopeTenant).inSingletonScope();
    }
});
