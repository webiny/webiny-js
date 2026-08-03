import { createFeature } from "@webiny/feature/api";
import { CreateThemeRepository } from "./CreateThemeRepository.js";
import { CreateThemeUseCase } from "./CreateThemeUseCase.js";

export const CreateThemeFeature = createFeature({
    name: "Theme/CreateTheme",
    register(container) {
        container.register(CreateThemeRepository).inSingletonScope();
        container.register(CreateThemeUseCase);
    }
});
