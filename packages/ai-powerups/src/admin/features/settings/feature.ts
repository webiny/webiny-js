import { createFeature } from "@webiny/feature/admin";
import { SharedSettingsFeature } from "./shared/feature.js";
import { GetSettingsFeature } from "./getSettings/feature.js";
import { UpdateSettingsFeature } from "./updateSettings/feature.js";

export const SettingsFeature = createFeature({
    name: "AiPowerUps/Settings",
    register(container) {
        SharedSettingsFeature.register(container);
        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
    },
    resolve() {
        return {};
    }
});
