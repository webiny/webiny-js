import { createFeature } from "@webiny/feature/api";
import { UpdateThemeRepository } from "./UpdateThemeRepository.js";
import { UpdateThemeUseCase } from "./UpdateThemeUseCase.js";

export const UpdateThemeFeature = createFeature({
    name: "Theme/UpdateTheme",
    register(container) {
        container.register(UpdateThemeRepository).inSingletonScope();
        container.register(UpdateThemeUseCase);
    }
});
