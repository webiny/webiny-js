import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
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
        const enabled = container
            .resolve(FeatureFlags)
            .get()
            .isEnabled("aiPowerups.adminAssistant");

        if (!enabled) {
            return;
        }

        // Inside the gate, so an unlicensed project gets no settings row for a feature it cannot use.
        container.register(AiChatCapability);
        container.register(PowerUpsAiChatResolver);
    }
});
