import { createFeature } from "@webiny/feature/api";
import { CmsCompareEntryRevisionsUseCaseImplementation } from "./CmsCompareEntryRevisionsUseCase.js";
import { CmsCompareEntryRevisionsCapability } from "./capability.js";

export const CmsCompareEntryRevisionsFeature = createFeature({
    name: "AiPowerUps/CmsCompareEntryRevisions",
    register(container) {
        container.register(CmsCompareEntryRevisionsCapability);
        container.register(CmsCompareEntryRevisionsUseCaseImplementation);
    }
});
