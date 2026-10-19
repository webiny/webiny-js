import { createFeature } from "@webiny/feature/api";
import { GetAiChatUseCase } from "./GetAiChatUseCase.js";

export const GetAiChatFeature = createFeature({
    name: "AiPowerUps/GetAiChat",
    register(container) {
        container.register(GetAiChatUseCase);
    }
});
