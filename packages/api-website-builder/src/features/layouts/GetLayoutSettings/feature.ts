import { createFeature } from "@webiny/feature/api";
import { GetLayoutSettingsRepository } from "./GetLayoutSettingsRepository.js";
import { GetLayoutSettingsUseCase } from "./GetLayoutSettingsUseCase.js";

export const GetLayoutSettingsFeature = createFeature({
    name: "WebsiteBuilder/GetLayoutSettings",
    register(container) {
        container.register(GetLayoutSettingsRepository).inSingletonScope();
        container.register(GetLayoutSettingsUseCase);
    }
});
