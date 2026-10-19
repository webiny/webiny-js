import { createFeature } from "@webiny/feature/api";
import { AiChatsRepository } from "./AiChatsRepository.js";

export const AiChatsRepositoryFeature = createFeature({
    name: "AiPowerUps/AiChatsRepository",
    register(container) {
        container.register(AiChatsRepository).inSingletonScope();
    }
});
