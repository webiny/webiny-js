import { createFeature } from "@webiny/feature/admin";
import { IdentityTenantSwitcherSource } from "./IdentityTenantSwitcherSource.js";

export const TenantSwitcherFeature = createFeature({
    name: "TenantSwitcher",
    register(container) {
        container.register(IdentityTenantSwitcherSource).inSingletonScope();
    }
});
