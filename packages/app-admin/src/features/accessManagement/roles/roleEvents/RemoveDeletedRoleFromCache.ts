import { RolesListCache } from "../listRoles/abstractions.js";
import { RoleDeletedEventHandler } from "./abstractions.js";

/** Takes the deleted role out of the roles list cache. A deleted role cannot be read back. */
class RemoveDeletedRoleFromCacheImpl implements RoleDeletedEventHandler.Interface {
    constructor(private cache: RolesListCache.Interface) {}

    async handle(event: RoleDeletedEventHandler.Event): Promise<void> {
        const { id } = event.payload;
        this.cache.removeItems(role => role.id === id);
    }
}

export const RemoveDeletedRoleFromCache = RoleDeletedEventHandler.createImplementation({
    implementation: RemoveDeletedRoleFromCacheImpl,
    dependencies: [RolesListCache]
});
