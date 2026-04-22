import { createFeature } from "@webiny/feature/admin";
import { SettingsCache } from "./abstractions.js";
import { settingsCache } from "./SettingsCache.js";

export const SharedSettingsFeature = createFeature({
    name: "AiPowerUps/SharedSettings",
    register(container) {
        container.registerInstance(SettingsCache, settingsCache);
    },
    resolve(container) {
        return {
            settingsCache: container.resolve(SettingsCache)
        };
    }
});
