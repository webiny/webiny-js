import { createFeature } from "@webiny/feature/api";
import { DeleteThemeRepository } from "./DeleteThemeRepository.js";
import { DeleteThemeUseCase } from "./DeleteThemeUseCase.js";

export const DeleteThemeFeature = createFeature({
    name: "Theme/DeleteTheme",
    register(container) {
        container.register(DeleteThemeRepository).inSingletonScope();
        container.register(DeleteThemeUseCase);
    }
});
