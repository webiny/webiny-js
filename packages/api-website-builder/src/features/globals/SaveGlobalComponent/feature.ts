import { createFeature } from "@webiny/feature/api";
import { SaveGlobalComponentRepository } from "./SaveGlobalComponentRepository.js";
import { SaveGlobalComponentUseCase } from "./SaveGlobalComponentUseCase.js";

export const SaveGlobalComponentFeature = createFeature({
    name: "WebsiteBuilder/SaveGlobalComponent",
    register(container) {
        container.register(SaveGlobalComponentRepository).inSingletonScope();
        container.register(SaveGlobalComponentUseCase);
    }
});
