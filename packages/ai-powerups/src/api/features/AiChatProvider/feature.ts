import { createFeature } from "@webiny/feature/api";
import { PowerUpsAiChatProvider } from "./PowerUpsAiChatProvider.js";

/**
 * Points the admin AI assistant at the providers configured in AI Power-Ups.
 *
 * Registered after `AiChatFeature`'s environment default so this one wins.
 */
export const AiChatProviderFeature = createFeature({
    name: "AiPowerUps/AiChatProvider",
    register(container) {
        container.register(PowerUpsAiChatProvider);
    }
});
