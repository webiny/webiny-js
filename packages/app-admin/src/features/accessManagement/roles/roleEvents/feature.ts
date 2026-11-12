import { createFeature } from "@webiny/feature/admin";
import { RefreshRoleInCacheRepository } from "./RefreshRoleInCacheRepository.js";
import { AddCreatedRoleToCache } from "./AddCreatedRoleToCache.js";
import { RefreshUpdatedRoleInCache } from "./RefreshUpdatedRoleInCache.js";
import { RemoveDeletedRoleFromCache } from "./RemoveDeletedRoleFromCache.js";
import { RoleWebsocketMessages } from "./RoleWebsocketMessages.js";

/**
 * Keeps the roles list current when roles are created, updated or deleted on the server. Needs
 * `ListRolesFeature` and `GetRoleFeature` in the same container, for the cache and the gateway.
 */
export const RoleEventsFeature = createFeature({
    name: "AccessManagement/RoleEvents",
    register(container) {
        container.register(RefreshRoleInCacheRepository).inSingletonScope();
        container.register(AddCreatedRoleToCache);
        container.register(RefreshUpdatedRoleInCache);
        container.register(RemoveDeletedRoleFromCache);
        container.register(RoleWebsocketMessages);
    }
});
