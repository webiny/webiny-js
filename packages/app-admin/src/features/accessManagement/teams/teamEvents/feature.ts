import { createFeature } from "@webiny/feature/admin";
import { RefreshTeamInCacheRepository } from "./RefreshTeamInCacheRepository.js";
import { AddCreatedTeamToCache } from "./AddCreatedTeamToCache.js";
import { RefreshUpdatedTeamInCache } from "./RefreshUpdatedTeamInCache.js";
import { RemoveDeletedTeamFromCache } from "./RemoveDeletedTeamFromCache.js";
import { TeamWebsocketMessages } from "./TeamWebsocketMessages.js";

/**
 * Keeps the teams list current when teams are created, updated or deleted on the server. Needs
 * `ListTeamsFeature` and `GetTeamFeature` in the same container, for the cache and the gateway.
 */
export const TeamEventsFeature = createFeature({
    name: "AccessManagement/TeamEvents",
    register(container) {
        container.register(RefreshTeamInCacheRepository).inSingletonScope();
        container.register(AddCreatedTeamToCache);
        container.register(RefreshUpdatedTeamInCache);
        container.register(RemoveDeletedTeamFromCache);
        container.register(TeamWebsocketMessages);
    }
});
