import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AiChatConfig } from "./abstractions.js";
import { AiChatUseCase } from "./AiChatUseCase.js";
import { AiChatStreamRouteDefinition } from "./AiChatStreamRoute.js";
import { AiChatCapability } from "./capability.js";

/**
 * How many rounds the agent loop may take before it is cut off.
 *
 * Enough for the deepest expected chain: list models, describe one, query it, answer — plus room for
 * a corrected retry after a rejected filter.
 *
 * Deliberately not configurable. It is a runaway guard, closer to a timeout than a setting, and the
 * number only means something next to the tool chains the assistant actually walks. Exposing it
 * invites a project to raise it to 100 and find out what that costs.
 */
const MAX_STEPS = 12;

/**
 * The admin assistant: its capability, the use case, and the HTTP route that reaches it.
 *
 * Lives in AI Power-Ups rather than in a package of its own because everything it needs is here —
 * the settings that choose its model, the capability resolver that reads them, and the tools it
 * calls. As a separate package it could only reach those through an abstraction registered back
 * from this side, which is an indirection that bought nothing.
 */
export const AiChatFeature = createFeature({
    name: "AiPowerUps/AiChat",
    register(container) {
        // Register-time gate on the effective flags (project config && live WCP license), matching
        // how every other AI feature gates itself. Nothing is registered when it is off, so an
        // unlicensed project has no `/stream/ai/chat` route and no settings row.
        const enabled = container
            .resolve(FeatureFlags)
            .get()
            .isEnabled("aiPowerups.adminAssistant");

        if (!enabled) {
            return;
        }

        container.register(AiChatCapability);
        container.registerInstance(AiChatConfig, { maxSteps: MAX_STEPS });
        container.register(AiChatUseCase);

        /*
         * Only the definition is registered: the router matches on it and builds the handler it
         * names once a request actually hits the path.
         */
        container.register(AiChatStreamRouteDefinition);
    }
});
