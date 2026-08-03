import { createFeature } from "@webiny/feature/api";
import { PublishThemeRepository } from "./PublishThemeRepository.js";
import { PublishThemeUseCase } from "./PublishThemeUseCase.js";

export const PublishThemeFeature = createFeature({
    name: "Theme/PublishTheme",
    register(container) {
        container.register(PublishThemeRepository).inSingletonScope();
        container.register(PublishThemeUseCase);
    }
});
