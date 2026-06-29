import { createFeature } from "@webiny/feature/api";
import { CmsGenerateEntryContentUseCaseImplementation } from "./CmsGenerateEntryContentUseCase.js";
import { CmsGenerateEntryContentTask } from "./CmsGenerateEntryContentTask.js";

export const CmsGenerateEntryContentFeature = createFeature({
    name: "AiPowerUps/CmsGenerateEntryContent",
    register(container) {
        container.register(CmsGenerateEntryContentUseCaseImplementation);
        container.register(CmsGenerateEntryContentTask);
    }
});
