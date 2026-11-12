import { RefreshRoleInCacheRepository } from "./abstractions.js";
import { RoleUpdatedEventHandler } from "./abstractions.js";

/** Replaces the updated role in the roles list cache with what the server now has. */
class RefreshUpdatedRoleInCacheImpl implements RoleUpdatedEventHandler.Interface {
    constructor(private repository: RefreshRoleInCacheRepository.Interface) {}

    async handle(event: RoleUpdatedEventHandler.Event): Promise<void> {
        await this.repository.execute(event.payload.id);
    }
}

export const RefreshUpdatedRoleInCache = RoleUpdatedEventHandler.createImplementation({
    implementation: RefreshUpdatedRoleInCacheImpl,
    dependencies: [RefreshRoleInCacheRepository]
});
