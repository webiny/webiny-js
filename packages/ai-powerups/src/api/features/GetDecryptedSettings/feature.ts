import { createFeature } from "@webiny/feature/api";
import { GetDecryptedSettingsUseCaseImplementation } from "./GetDecryptedSettingsUseCase.js";

export const GetDecryptedSettingsFeature = createFeature({
    name: "AiPowerUpsGetDecryptedSettings",
    register(container) {
        container.register(GetDecryptedSettingsUseCaseImplementation);
    }
});
