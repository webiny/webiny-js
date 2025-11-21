import { createFeature } from "@webiny/feature/api";
import { GetSettingsUseCase } from "./GetSettingsUseCase.js";

export const GetSettingsFeature = createFeature({
    name: "FileManager.GetSettings",
    register(container) {
        container.register(GetSettingsUseCase);
    }
});
