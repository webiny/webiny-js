import { createFeature } from "@webiny/feature/api";
import { QueueCmsGenerateEntryContentUseCase } from "./QueueCmsGenerateEntryContentUseCase.js";

export const QueueCmsGenerateEntryContentFeature = createFeature({
    name: "AiPowerUps/QueueCmsGenerateEntryContent",
    register(container) {
        container.register(QueueCmsGenerateEntryContentUseCase);
    }
});
