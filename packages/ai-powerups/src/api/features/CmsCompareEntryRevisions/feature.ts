import { createFeature } from "@webiny/feature/api";
import { CmsCompareEntryRevisionsUseCaseImplementation } from "./CmsCompareEntryRevisionsUseCase.js";

export const CmsCompareEntryRevisionsFeature = createFeature({
    name: "AiPowerUps/CmsCompareEntryRevisions",
    register(container) {
        container.register(CmsCompareEntryRevisionsUseCaseImplementation);
    }
});
