import { createFeature } from "@webiny/feature/admin";
import { ListModelsFeature } from "~/admin/features/listModels/index.js";
import { SharedSettingsFeature } from "~/admin/features/settings/shared/index.js";
import { GetSettingsFeature } from "~/admin/features/settings/getSettings/index.js";
import { UpdateSettingsFeature } from "~/admin/features/settings/updateSettings/index.js";
import { GeneratePageContentFeature } from "~/admin/features/generatePageContent/index.js";

export const AiPowerUpsHeadlessFeatures = createFeature({
    name: "AiPowerUps/HeadlessFeatures",
    register(container) {
        SharedSettingsFeature.register(container);
        GetSettingsFeature.register(container);
        UpdateSettingsFeature.register(container);
        ListModelsFeature.register(container);
        GeneratePageContentFeature.register(container);
    },
    resolve() {
        return {};
    }
});
