import { createFeature } from "@webiny/feature/api";
import { AiChatConfig } from "./abstractions.js";
import { AiChatUseCase } from "./AiChatUseCase.js";
import { EnvAiChatProvider } from "./EnvAiChatProvider.js";
import { AiChatRoute } from "./AiChatRoute.js";
import { AiChatStreamRoute } from "./AiChatStreamRoute.js";

/**
 * Enough steps for the deepest expected chain: list models, describe one, query it, answer — plus room
 * for a corrected retry after a rejected filter.
 */
const DEFAULT_MAX_STEPS = 12;

/**
 * The AI chat feature: the use case, its configuration, and the two HTTP routes that reach it.
 *
 * Routes live beside the use case rather than in a separate package, matching `AiImageEnrichment`.
 * The assistant is only ever reached over HTTP, so a second package bought an indirection nobody
 * used and one more manifest to keep in sync.
 */
export const AiChatFeature = createFeature({
    name: "AiChat",
    register: container => {
        container.registerInstance(AiChatConfig, {
            maxSteps: Number(process.env["WEBINY_API_AI_CHAT_MAX_STEPS"]) || DEFAULT_MAX_STEPS
        });
        /*
         * Registered first so a later registration wins. AI Power-Ups overrides this with providers
         * configured in the admin UI.
         */
        container.register(EnvAiChatProvider);
        container.register(AiChatUseCase);

        // Buffered and streamed. A client picks by URL; see AiChatStreamRoute for why both exist.
        container.register(AiChatRoute);
        container.register(AiChatStreamRoute);
    }
});
