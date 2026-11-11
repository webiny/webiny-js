import { createFeature } from "@webiny/feature/admin";
import { AiPowerUpsSettingsLocation } from "./AiPowerUpsSettingsLocation.js";

export const SettingsLocationFeature = createFeature({
    name: "AiPowerUps/SettingsLocation",
    register(container) {
        container.register(AiPowerUpsSettingsLocation).inSingletonScope();
    },
    resolve() {
        return {};
    }
});
