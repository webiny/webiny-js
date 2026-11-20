import { createFeature } from "@webiny/feature/admin";
import { AiChatsGateway } from "./AiChatsGateway.js";
import { AiChatsRepository } from "./AiChatsRepository.js";
import { AiChatsRepository as RepositoryAbstraction } from "./abstractions.js";

export const AiChatsFeature = createFeature({
    name: "AiChats",
    register(container) {
        container.register(AiChatsGateway);
        // Singleton so the assistant and the chats panel share one list.
        container.register(AiChatsRepository).inSingletonScope();
    },
    resolve(container) {
        return { repository: container.resolve(RepositoryAbstraction) };
    }
});
