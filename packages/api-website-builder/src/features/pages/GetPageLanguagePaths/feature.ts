import { createFeature } from "@webiny/feature/api";
import { GetPageLanguagePathsRepository } from "./GetPageLanguagePathsRepository.js";
import { GetPageLanguagePathsUseCase } from "./GetPageLanguagePathsUseCase.js";

export const GetPageLanguagePathsFeature = createFeature({
    name: "WebsiteBuilder/GetPageLanguagePaths",
    register(container) {
        container.register(GetPageLanguagePathsRepository).inSingletonScope();
        container.register(GetPageLanguagePathsUseCase);
    }
});
