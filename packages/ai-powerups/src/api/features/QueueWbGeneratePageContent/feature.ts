import { createFeature } from "@webiny/feature/api";
import { QueueWbGeneratePageContentUseCase } from "./QueueWbGeneratePageContentUseCase.js";

export const QueueWbGeneratePageContentFeature = createFeature({
    name: "AiPowerUps/QueueWbGeneratePageContent",
    register(container) {
        container.register(QueueWbGeneratePageContentUseCase);
    }
});
