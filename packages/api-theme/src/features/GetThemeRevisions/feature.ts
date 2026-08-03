import { createFeature } from "@webiny/feature/api";
import { GetThemeRevisionsRepository } from "./GetThemeRevisionsRepository.js";
import { GetThemeRevisionsUseCase } from "./GetThemeRevisionsUseCase.js";

export const GetThemeRevisionsFeature = createFeature({
    name: "Theme/GetThemeRevisions",
    register(container) {
        container.register(GetThemeRevisionsRepository).inSingletonScope();
        container.register(GetThemeRevisionsUseCase);
    }
});
