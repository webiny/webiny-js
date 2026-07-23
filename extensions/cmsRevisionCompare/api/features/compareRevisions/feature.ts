import { createFeature } from "webiny/api";
import { CompareRevisionsUseCaseImplementation } from "./CompareRevisionsUseCase.js";

export const CompareRevisionsFeature = createFeature({
    name: "CmsRevisionCompare/CompareRevisions",
    register(container) {
        container.register(CompareRevisionsUseCaseImplementation);
    }
});
