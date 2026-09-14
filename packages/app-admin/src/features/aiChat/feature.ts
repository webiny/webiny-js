import { createFeature } from "@webiny/feature/admin";
import { AiChatGateway } from "./AiChatGateway.js";
import { AiChatPresenter } from "./AiChatPresenter.js";
import { AiChatPresenter as Abstraction } from "./abstractions.js";

export const AiChatFeature = createFeature({
    name: "AiChat",
    register(container) {
        container.register(AiChatGateway);
        // Singleton so the conversation survives re-renders of the palette that reads it.
        container.register(AiChatPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(Abstraction) };
    }
});
