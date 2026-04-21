import { createFeature } from "@webiny/feature/admin";
import { GeneratePageContentUseCase } from "./GeneratePageContentUseCase.js";
import { GeneratePageContentGateway } from "./GeneratePageContentGateway.js";

export const GeneratePageContentFeature = createFeature({
    name: "AiPowerUps/GeneratePageContent",
    register(container) {
        container.register(GeneratePageContentUseCase);
        container.register(GeneratePageContentGateway).inSingletonScope();
    }
});
