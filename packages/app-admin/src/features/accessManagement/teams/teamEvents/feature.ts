import { createFeature } from "@webiny/feature/admin";
import { AddCreatedTeamRepository } from "./AddCreatedTeamRepository.js";
import { AddCreatedTeamToCache } from "./AddCreatedTeamToCache.js";
import { TeamWebsocketMessages } from "./TeamWebsocketMessages.js";

/**
 * Keeps the teams list current when teams are created on the server. Needs `ListTeamsFeature` and
 * `GetTeamFeature` in the same container, for the cache and the gateway.
 */
export const TeamEventsFeature = createFeature({
    name: "AccessManagement/TeamEvents",
    register(container) {
        container.register(AddCreatedTeamRepository).inSingletonScope();
        container.register(AddCreatedTeamToCache);
        container.register(TeamWebsocketMessages);
    }
});
