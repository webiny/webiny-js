import { createFeature } from "@webiny/feature/api";
import { ListAiChatsUseCase } from "./ListAiChatsUseCase.js";

export const ListAiChatsFeature = createFeature({
    name: "AiPowerUps/ListAiChats",
    register(container) {
        container.register(ListAiChatsUseCase);
    }
});
