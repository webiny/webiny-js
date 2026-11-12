import { RefreshRoleInCacheRepository } from "./abstractions.js";
import { RoleCreatedEventHandler } from "./abstractions.js";

/** Adds the created role to the roles list cache, which the Roles view renders from. */
class AddCreatedRoleToCacheImpl implements RoleCreatedEventHandler.Interface {
    constructor(private repository: RefreshRoleInCacheRepository.Interface) {}

    async handle(event: RoleCreatedEventHandler.Event): Promise<void> {
        await this.repository.execute(event.payload.id);
    }
}

export const AddCreatedRoleToCache = RoleCreatedEventHandler.createImplementation({
    implementation: AddCreatedRoleToCacheImpl,
    dependencies: [RefreshRoleInCacheRepository]
});
