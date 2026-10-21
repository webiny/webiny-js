import { createFeature } from "@webiny/feature/api";
import { GetPublishedLayoutRepository } from "./GetPublishedLayoutRepository.js";
import { GetPageLayoutUseCase } from "./GetPageLayoutUseCase.js";

export const GetPageLayoutFeature = createFeature({
    name: "WebsiteBuilder/GetPageLayout",
    register(container) {
        container.register(GetPublishedLayoutRepository).inSingletonScope();
        container.register(GetPageLayoutUseCase);
    }
});
