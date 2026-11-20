import { createFeature } from "@webiny/feature/api";
import CmsGenerateEntryContentUseCase from "./CmsGenerateEntryContentUseCase.js";
import { CmsGenerateEntryContentTask } from "./CmsGenerateEntryContentTask.js";
import { CmsGenerateEntryCapability } from "./capability.js";
import QueueCmsGenerateEntryContentUseCase from "./QueueCmsGenerateEntryContentUseCase.js";

export const CmsGenerateEntryContentFeature = createFeature({
    name: "AiPowerUps/CmsGenerateEntryContent",
    register(container) {
        container.register(CmsGenerateEntryCapability);
        container.register(CmsGenerateEntryContentUseCase);
        container.register(CmsGenerateEntryContentTask);
        container.register(QueueCmsGenerateEntryContentUseCase);
    }
});
