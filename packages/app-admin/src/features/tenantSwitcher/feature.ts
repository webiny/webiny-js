import { createFeature } from "@webiny/feature/admin";
import { IdentityTenantSwitcherSource } from "./IdentityTenantSwitcherSource.js";
import { LocalStorageRecentTenantsRepository } from "./LocalStorageRecentTenantsRepository.js";

export const TenantSwitcherFeature = createFeature({
    name: "TenantSwitcher",
    register(container) {
        container.register(IdentityTenantSwitcherSource).inSingletonScope();
        container.register(LocalStorageRecentTenantsRepository).inSingletonScope();
    }
});
