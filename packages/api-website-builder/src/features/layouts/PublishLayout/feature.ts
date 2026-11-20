import { createFeature } from "@webiny/feature/api";
import { PublishLayoutRepository } from "./PublishLayoutRepository.js";
import { PublishLayoutUseCase } from "./PublishLayoutUseCase.js";

export const PublishLayoutFeature = createFeature({
    name: "WebsiteBuilder/PublishLayout",
    register(container) {
        container.register(PublishLayoutRepository).inSingletonScope();
        container.register(PublishLayoutUseCase);
    }
});
