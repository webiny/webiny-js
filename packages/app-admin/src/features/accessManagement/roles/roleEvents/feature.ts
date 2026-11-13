import { createFeature } from "@webiny/feature/admin";
import { RefreshRoleInCacheRepository } from "./RefreshRoleInCacheRepository.js";
import { ApplyRoleChangeToCache } from "./ApplyRoleChangeToCache.js";

/**
 * Keeps the roles list current when roles are created, updated or deleted on the server. Needs
 * `ListRolesFeature` and `GetRoleFeature` in the same container, for the cache and the gateway.
 */
export const RoleEventsFeature = createFeature({
    name: "AccessManagement/RoleEvents",
    register(container) {
        container.register(RefreshRoleInCacheRepository).inSingletonScope();
        container.register(ApplyRoleChangeToCache);
    }
});
