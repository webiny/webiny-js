import { createFeature } from "@webiny/feature/api";
import { GetActiveThemeUseCase } from "./GetActiveThemeUseCase.js";

export const GetActiveThemeFeature = createFeature({
    name: "Theme/GetActiveTheme",
    register(container) {
        container.register(GetActiveThemeUseCase);
    }
});
