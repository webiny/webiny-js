import { createFeature } from "@webiny/feature/api";
import { AiChatConfig } from "./abstractions.js";
import { AiChatUseCase } from "./AiChatUseCase.js";
import { AiChatStreamRouteDefinition } from "./AiChatStreamRoute.js";

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
 * The AI chat feature: the use case, its configuration, and the HTTP route that reaches it.
 *
 * Routes live beside the use case rather than in a separate package, matching `AiImageEnrichment`.
 * The assistant is only ever reached over HTTP, so a second package bought an indirection nobody
 * used and one more manifest to keep in sync.
 */
export const AiChatFeature = createFeature({
    name: "AiChat",
    register: container => {
        container.registerInstance(AiChatConfig, { maxSteps: MAX_STEPS });
        /*
         * No `AiChatResolver` is registered here. The model, the credential and the prompt all come
         * from AI Power-Ups settings, so AI Power-Ups registers the only implementation. A project
         * that removes that extension gets `No registration found for AiChatResolver` on the first
         * request, which beats an assistant quietly running on a model nobody chose.
         */
        container.register(AiChatUseCase);

        /*
         * Only the definition is registered: the router matches on it and builds the handler it
         * names once a request actually hits the path.
         */
        container.register(AiChatStreamRouteDefinition);
    }
});
