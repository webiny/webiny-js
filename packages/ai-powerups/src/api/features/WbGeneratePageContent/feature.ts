import { createFeature } from "@webiny/feature/api";
import { WbGeneratePageContentUseCaseImplementation } from "./WbGeneratePageContentUseCase.js";
import { WbGeneratePageContentTask } from "./WbGeneratePageContentTask.js";
import { WbGeneratePageCapability } from "./capability.js";

export const WbGeneratePageContentFeature = createFeature({
    name: "AiPowerUps/WbGeneratePageContent",
    register(container) {
        container.register(WbGeneratePageCapability);
        container.register(WbGeneratePageContentUseCaseImplementation);
        container.register(WbGeneratePageContentTask);
    }
});
