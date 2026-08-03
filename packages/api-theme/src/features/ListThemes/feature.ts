import { createFeature } from "@webiny/feature/api";
import { ListThemesRepository } from "./ListThemesRepository.js";
import { ListThemesUseCase } from "./ListThemesUseCase.js";

export const ListThemesFeature = createFeature({
    name: "Theme/ListThemes",
    register(container) {
        container.register(ListThemesRepository).inSingletonScope();
        container.register(ListThemesUseCase);
    }
});
