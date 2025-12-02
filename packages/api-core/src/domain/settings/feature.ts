import { createFeature } from "@webiny/feature/api";
import { SettingsModelBuilder } from "./SettingsModelBuilder.js";
import { SettingsModelFactory } from "./SettingsModelFactory.js";

export const SettingsDomain = createFeature({
    name: "SettingsDomain",
    register(container) {
        container.register(SettingsModelBuilder);
        container.register(SettingsModelFactory);
    }
});
