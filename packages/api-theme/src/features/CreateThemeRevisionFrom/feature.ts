import { createFeature } from "@webiny/feature/api";
import { CreateThemeRevisionFromRepository } from "./CreateThemeRevisionFromRepository.js";
import { CreateThemeRevisionFromUseCase } from "./CreateThemeRevisionFromUseCase.js";

export const CreateThemeRevisionFromFeature = createFeature({
    name: "Theme/CreateThemeRevisionFrom",
    register(container) {
        container.register(CreateThemeRevisionFromRepository).inSingletonScope();
        container.register(CreateThemeRevisionFromUseCase);
    }
});
