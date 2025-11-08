import { createFeature } from "@webiny/feature/api";
import { GetSettingsUseCase } from "./GetSettingsUseCase.js";

export const GetSettingsFeature = createFeature({
    name: "GetSettings",
    register(container) {
        container.register(GetSettingsUseCase);
    }
});
