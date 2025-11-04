import { createFeature } from "@webiny/feature/api";
import { SettingsRepository } from "./shared/SettingsRepository.js";
import { GetSettingsFeature } from "./GetSettings/feature.js";
import { UpdateSettingsFeature } from "./UpdateSettings/feature.js";
import { DeleteSettingsFeature } from "./DeleteSettings/feature.js";
import { SettingsStorageOperations } from "~/features/settings/shared/abstractions.js";

export const SettingsFeature = createFeature({
    name: "Settings",
    register(container, storageOperations: SettingsStorageOperations.Interface) {
        // Register legacy storage operations
        container.registerInstance(SettingsStorageOperations, storageOperations);

        // Register repository in singleton scope
        container.register(SettingsRepository).inSingletonScope();

        // Register use cases
        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
        DeleteSettingsFeature.register(container);
    }
});
