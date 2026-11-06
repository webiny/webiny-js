import { createFeature } from "@webiny/feature/api";
import { WbGeneratePageContentUseCaseImplementation } from "./WbGeneratePageContentUseCase.js";
import { WbGeneratePageContentTask } from "./WbGeneratePageContentTask.js";
import { QueueWbGeneratePageContentUseCaseImplementation } from "./QueueWbGeneratePageContentUseCase.js";

export const WbGeneratePageContentFeature = createFeature({
    name: "AiPowerUps/WbGeneratePageContent",
    register(container) {
        container.register(WbGeneratePageContentUseCaseImplementation);
        container.register(WbGeneratePageContentTask);
        container.register(QueueWbGeneratePageContentUseCaseImplementation);
    }
});
