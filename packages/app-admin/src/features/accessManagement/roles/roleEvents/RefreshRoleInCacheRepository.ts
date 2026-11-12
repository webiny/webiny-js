import { GetRoleGateway } from "../getRole/abstractions.js";
import { RolesListCache } from "../listRoles/abstractions.js";
import { RefreshRoleInCacheRepository as RepositoryAbstraction } from "./abstractions.js";

/**
 * Read back rather than taken from the message, so the role has the same fields as one the admin loads
 * itself. A role the list already has is replaced where it is, so an update does not move its row; a
 * new one is added.
 */
class RefreshRoleInCacheRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: GetRoleGateway.Interface,
        private cache: RolesListCache.Interface
    ) {}

    async execute(id: string): Promise<void> {
        const role = await this.gateway.execute(id);

        if (this.cache.getItem(item => item.id === id)) {
            this.cache.updateItems(item => (item.id === id ? role : item));
            return;
        }

        this.cache.addItems([role]);
    }
}

export const RefreshRoleInCacheRepository = RepositoryAbstraction.createImplementation({
    implementation: RefreshRoleInCacheRepositoryImpl,
    dependencies: [GetRoleGateway, RolesListCache]
});
