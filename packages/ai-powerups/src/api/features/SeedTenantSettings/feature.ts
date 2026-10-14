import { createFeature } from "@webiny/feature/api";
import { SeedTenantSettingsInstaller } from "./SeedTenantSettingsInstaller.js";

export const SeedTenantSettingsFeature = createFeature({
    name: "AiPowerUpsSeedTenantSettings",
    register(container) {
        container.register(SeedTenantSettingsInstaller);
    }
});
