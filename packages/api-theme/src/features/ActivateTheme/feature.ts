import { createFeature } from "@webiny/feature/api";
import { ActivateThemeUseCase } from "./ActivateThemeUseCase.js";
import { DeactivateThemeUseCase } from "./DeactivateThemeUseCase.js";

export const ActivateThemeFeature = createFeature({
    name: "Theme/ActivateTheme",
    register(container) {
        container.register(ActivateThemeUseCase);
        container.register(DeactivateThemeUseCase);
    }
});
