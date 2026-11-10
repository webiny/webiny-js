import { createFeature } from "@webiny/feature/api";
import { GetPublishedLayoutBySlugRepository } from "./GetPublishedLayoutBySlugRepository.js";
import { GetLayoutBySlugUseCase } from "./GetLayoutBySlugUseCase.js";

export const GetLayoutBySlugFeature = createFeature({
    name: "WebsiteBuilder/GetLayoutBySlug",
    register(container) {
        container.register(GetPublishedLayoutBySlugRepository).inSingletonScope();
        container.register(GetLayoutBySlugUseCase);
    }
});
