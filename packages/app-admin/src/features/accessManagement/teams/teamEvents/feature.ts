import { createFeature } from "@webiny/feature/admin";
import { RefreshTeamInCacheRepository } from "./RefreshTeamInCacheRepository.js";
import { ApplyTeamChangeToCache } from "./ApplyTeamChangeToCache.js";

/**
 * Keeps the teams list current when teams are created, updated or deleted on the server. Needs
 * `ListTeamsFeature` and `GetTeamFeature` in the same container, for the cache and the gateway.
 */
export const TeamEventsFeature = createFeature({
    name: "AccessManagement/TeamEvents",
    register(container) {
        container.register(RefreshTeamInCacheRepository).inSingletonScope();
        container.register(ApplyTeamChangeToCache);
    }
});
