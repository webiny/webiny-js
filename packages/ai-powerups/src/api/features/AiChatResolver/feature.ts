import { createFeature } from "@webiny/feature/api";
import { PowerUpsAiChatResolver } from "./PowerUpsAiChatResolver.js";
import { AiChatCapability } from "./capability.js";

/**
 * Makes the admin AI assistant one of the project's AI capabilities.
 *
 * The capability gives it a row in Settings → AI Power-Ups, so a project can point it at a different
 * model or append its own instructions. The provider is what `@webiny/ai-chat` actually calls, and is
 * registered after `AiChatFeature`'s environment default so this one wins.
 */
export const AiChatResolverFeature = createFeature({
    name: "AiPowerUps/AiChatResolver",
    register(container) {
        container.register(AiChatCapability);
        container.register(PowerUpsAiChatResolver);
    }
});
