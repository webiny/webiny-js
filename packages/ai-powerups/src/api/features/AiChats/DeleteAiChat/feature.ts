import { createFeature } from "@webiny/feature/api";
import { DeleteAiChatUseCase } from "./DeleteAiChatUseCase.js";

export const DeleteAiChatFeature = createFeature({
    name: "AiPowerUps/DeleteAiChat",
    register(container) {
        container.register(DeleteAiChatUseCase);
    }
});
