import { createFeature } from "@webiny/feature/api";
import { SaveAiChatUseCase } from "./SaveAiChatUseCase.js";

export const SaveAiChatFeature = createFeature({
    name: "AiPowerUps/SaveAiChat",
    register(container) {
        container.register(SaveAiChatUseCase);
    }
});
