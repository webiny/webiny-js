import { createFeature } from "@webiny/feature/api";
import { GetThemeByIdRepository } from "./GetThemeByIdRepository.js";
import { GetThemeByIdUseCase } from "./GetThemeByIdUseCase.js";

export const GetThemeByIdFeature = createFeature({
    name: "Theme/GetThemeById",
    register(container) {
        container.register(GetThemeByIdRepository).inSingletonScope();
        container.register(GetThemeByIdUseCase);
    }
});
