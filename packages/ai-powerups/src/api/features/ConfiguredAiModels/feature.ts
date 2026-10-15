import { createFeature } from "@webiny/feature/api";
import { ConfiguredAiModelsService } from "./ConfiguredAiModelsService.js";

export const ConfiguredAiModelsFeature = createFeature({
    name: "AiPowerUpsConfiguredAiModels",
    register(container) {
        container.register(ConfiguredAiModelsService);
    }
});
