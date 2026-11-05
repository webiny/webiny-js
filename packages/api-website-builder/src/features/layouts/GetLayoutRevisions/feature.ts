import { createFeature } from "@webiny/feature/api";
import { GetLayoutRevisionsRepository } from "./GetLayoutRevisionsRepository.js";
import { GetLayoutRevisionsUseCase } from "./GetLayoutRevisionsUseCase.js";

export const GetLayoutRevisionsFeature = createFeature({
    name: "WebsiteBuilder/GetLayoutRevisions",
    register(container) {
        container.register(GetLayoutRevisionsRepository).inSingletonScope();
        container.register(GetLayoutRevisionsUseCase);
    }
});
