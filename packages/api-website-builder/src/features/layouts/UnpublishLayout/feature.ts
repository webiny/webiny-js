import { createFeature } from "@webiny/feature/api";
import { UnpublishLayoutRepository } from "./UnpublishLayoutRepository.js";
import { UnpublishLayoutUseCase } from "./UnpublishLayoutUseCase.js";

export const UnpublishLayoutFeature = createFeature({
    name: "WebsiteBuilder/UnpublishLayout",
    register(container) {
        container.register(UnpublishLayoutRepository).inSingletonScope();
        container.register(UnpublishLayoutUseCase);
    }
});
