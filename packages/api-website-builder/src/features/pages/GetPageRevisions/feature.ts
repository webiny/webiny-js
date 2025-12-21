import { createFeature } from "@webiny/feature/api";
import { GetPageRevisionsRepository } from "./GetPageRevisionsRepository.js";
import { GetPageRevisionsUseCase } from "./GetPageRevisionsUseCase.js";

export const GetPageRevisionsFeature = createFeature({
    name: "WebsiteBuilder/GetPageRevisions",
    register(container) {
        container.register(GetPageRevisionsRepository).inSingletonScope();
        container.register(GetPageRevisionsUseCase);
    }
});
