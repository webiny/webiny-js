import { RecordChangedEventHandler } from "@webiny/app/features/recordChanges/index.js";
import { RolesListCache } from "../listRoles/abstractions.js";
import { RefreshRoleInCacheRepository } from "./abstractions.js";

// Sent by the api for roles; see `ROLE_RECORD_TYPE` in @webiny/api-core.
const ROLE_RECORD_TYPE = "security.role";

/**
 * Keeps the roles list cache, which the Roles view renders from, in step with the server. A created
 * or updated role is read back into it; a deleted role cannot be read back, so it is taken out.
 */
class ApplyRoleChangeToCacheImpl implements RecordChangedEventHandler.Interface {
    constructor(
        private repository: RefreshRoleInCacheRepository.Interface,
        private cache: RolesListCache.Interface
    ) {}

    async handle(event: RecordChangedEventHandler.Event): Promise<void> {
        const { type, id, change } = event.payload;
        if (type !== ROLE_RECORD_TYPE) {
            return;
        }

        if (change === "deleted") {
            this.cache.removeItems(role => role.id === id);
            return;
        }

        await this.repository.execute(id);
    }
}

export const ApplyRoleChangeToCache = RecordChangedEventHandler.createImplementation({
    implementation: ApplyRoleChangeToCacheImpl,
    dependencies: [RefreshRoleInCacheRepository, RolesListCache]
});
