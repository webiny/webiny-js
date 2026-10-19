import { createFeature } from "@webiny/feature/api";
import { SeedTenantSettingsInstaller } from "./SeedTenantSettingsInstaller.js";

export const FrontendSeedTenantSettingsFeature = createFeature({
    name: "FrontendSeedTenantSettings",
    register(container) {
        container.register(SeedTenantSettingsInstaller);
    }
});
