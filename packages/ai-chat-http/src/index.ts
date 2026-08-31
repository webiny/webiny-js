import { createFeature } from "@webiny/feature/api";
import { AiChatFeature } from "@webiny/ai-chat/api/index.js";
import { AiChatRoute } from "./AiChatRoute.js";
import { AiChatStreamRoute } from "./AiChatStreamRoute.js";

export { AiChatRoute };
export { AiChatStreamRoute };

/**
 * Exposes the AI chat feature over HTTP as `POST /ai/chat`.
 *
 * Registers the feature itself as well, so a caller wires up one thing. A host that wants the assistant
 * without an HTTP surface (a CLI, a background task) registers `AiChatFeature` from `@webiny/ai-chat`
 * directly and skips this package.
 */
export const AiChatHttpFeature = createFeature({
    name: "AiChatHttp",
    register: container => {
        AiChatFeature.register(container);
        container.register(AiChatRoute);
        container.register(AiChatStreamRoute);
    }
});
