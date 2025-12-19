import { createFeature } from "@webiny/feature/api";
import { PublishPageRepository } from "./PublishPageRepository.js";
import { PublishPageUseCase } from "./PublishPageUseCase.js";

export const PublishPageFeature = createFeature({
    name: "WebsiteBuilder/PublishPage",
    register(container) {
        container.register(PublishPageRepository).inSingletonScope();
        container.register(PublishPageUseCase);
    }
});
