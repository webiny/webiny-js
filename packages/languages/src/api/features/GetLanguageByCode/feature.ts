import { createFeature } from "@webiny/feature/api";
import { GetLanguageByCodeRepository } from "./GetLanguageByCodeRepository.js";
import { GetLanguageByCodeUseCase } from "./GetLanguageByCodeUseCase.js";

export const GetLanguageByCodeFeature = createFeature({
    name: "Languages/GetLanguageByCode",
    register(container) {
        container.register(GetLanguageByCodeRepository).inSingletonScope();
        container.register(GetLanguageByCodeUseCase);
    }
});
