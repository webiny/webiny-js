import { createFeature } from "@webiny/feature/api";
import { SettingsRepository } from "./shared/SettingsRepository.js";
import { GetSettingsFeature } from "./GetSettings/feature.js";
import { UpdateSettingsFeature } from "./UpdateSettings/feature.js";

export const SettingsFeature = createFeature({
    name: "Settings",
    register(container) {
        // Register repository in singleton scope
        container.register(SettingsRepository).inSingletonScope();

        // Register use cases
        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
    }
});
