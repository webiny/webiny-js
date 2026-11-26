import { createFeature } from "@webiny/feature/api";
import { TenantContext } from "./TenantContext.js";
import { ScopeTenant } from "~/features/tenancy/ScopeTenant/ScopeTenant.js";

export const TenantContextFeature = createFeature({
    name: "TenantContextFeature",
    register(container) {
        container.register(TenantContext).inSingletonScope();
        // The tenant storage operations read and write: the scope's.
        container.register(ScopeTenant).inSingletonScope();
    }
});
