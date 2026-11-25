import { createFeature } from "@webiny/feature/api";
import { GetSettingsRepositoryImplementation } from "./GetSettingsRepository.js";
import { GetSettingsUseCaseImplementation } from "./GetSettingsUseCase.js";

export const GetSettingsFeature = createFeature({
    name: "Mailer/GetSettings",
    register(container) {
        container.register(GetSettingsRepositoryImplementation).inSingletonScope();
        container.register(GetSettingsUseCaseImplementation);
    }
});
