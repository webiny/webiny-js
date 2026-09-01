import { createFeature } from "@webiny/feature/api";
import { GetDefaultLanguageRepository } from "./GetDefaultLanguageRepository.js";
import { GetDefaultLanguageUseCase } from "./GetDefaultLanguageUseCase.js";

export const GetDefaultLanguageFeature = createFeature({
    name: "Languages/GetDefaultLanguage",
    register(container) {
        container.register(GetDefaultLanguageRepository).inSingletonScope();
        container.register(GetDefaultLanguageUseCase);
    }
});
