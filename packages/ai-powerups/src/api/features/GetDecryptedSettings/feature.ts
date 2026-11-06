import { createFeature } from "@webiny/feature/api";
import { GetDecryptedSettingsUseCase } from "./GetDecryptedSettingsUseCase.js";

export const GetDecryptedSettingsFeature = createFeature({
    name: "AiPowerUpsGetDecryptedSettings",
    register(container) {
        container.register(GetDecryptedSettingsUseCase);
    }
});
