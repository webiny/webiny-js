import { createFeature } from "@webiny/feature/api";
import { SetDefaultLayoutRepository } from "./SetDefaultLayoutRepository.js";
import { SetDefaultLayoutUseCase } from "./SetDefaultLayoutUseCase.js";

export const SetDefaultLayoutFeature = createFeature({
    name: "WebsiteBuilder/SetDefaultLayout",
    register(container) {
        container.register(SetDefaultLayoutRepository).inSingletonScope();
        container.register(SetDefaultLayoutUseCase);
    }
});
