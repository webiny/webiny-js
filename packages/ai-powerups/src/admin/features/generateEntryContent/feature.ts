import { createFeature } from "@webiny/feature/admin";
import { GenerateEntryContentUseCase } from "./GenerateEntryContentUseCase.js";
import { GenerateEntryContentGateway } from "./GenerateEntryContentGateway.js";

export const GenerateEntryContentFeature = createFeature({
    name: "AiPowerUps/GenerateEntryContent",
    register(container) {
        container.register(GenerateEntryContentUseCase);
        container.register(GenerateEntryContentGateway).inSingletonScope();
    }
});
