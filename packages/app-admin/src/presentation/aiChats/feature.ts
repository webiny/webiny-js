import { createFeature } from "@webiny/feature/admin";
import { AiChatsPanelPresenter as Abstraction } from "./abstractions.js";
import { AiChatsPanelPresenter } from "./AiChatsPanelPresenter.js";

export const AiChatsPanelFeature = createFeature({
    name: "AiChatsPanel",
    register(container) {
        // Singleton so the palette that opens the panel and the panel itself share its state.
        container.register(AiChatsPanelPresenter).inSingletonScope();
    },
    resolve(container) {
        return { presenter: container.resolve(Abstraction) };
    }
});
