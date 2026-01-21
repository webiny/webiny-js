import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import { ListGroupsRepository as RepositoryAbstraction } from "./abstractions.js";
import { GroupCache } from "~/features/contentModelGroup/shared/abstractions.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/abstractions.js";
import { GroupPersistenceError } from "~/domain/contentModelGroup/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { CmsContext } from "~/features/shared/abstractions.js";
import { filterAsync } from "~/utils/filterAsync.js";
import { createCacheKey } from "~/utils/index.js";
import type { CmsGroup } from "~/types/index.js";

/**
 * ListGroupsRepository - Fetches all groups (plugin + database).
 *
 * Responsibilities:
 * - Create cache keys based on tenant + identity
 * - Provide data loader functions to GroupCache
 * - Fetch from plugin groups + database groups
 * - Apply access control filtering
 * - Return all accessible groups
 */
class ListGroupsRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(
        private groupCache: GroupCache.Interface,
        private pluginGroupsProvider: PluginGroupsProvider.Interface,
        private storageOperations: StorageOperations.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(): Promise<Result<CmsGroup[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Fetch all groups (plugin + database) with access control filtering
            const groups = await this.fetchAllGroups(tenant.id);

            return Result.ok(groups);
        } catch (error) {
            return Result.fail(new GroupPersistenceError(error as Error));
        }
    }

    private async fetchAllGroups(tenant: string): Promise<CmsGroup[]> {
        // 1. Fetch plugin groups (with caching and access control)
        const pluginGroups = await this.pluginGroupsProvider.getGroups();

        // 2. Fetch database groups (with caching)
        const dbCacheKey = createCacheKey({ tenant });
        const databaseGroups = await this.groupCache.getOrSet(dbCacheKey, async () => {
            return await this.storageOperations.groups.list({
                where: { tenant }
            });
        });

        // 3. Apply access control to database groups (with caching)
        const filteredCacheKey = createCacheKey({
            dbCacheKey: dbCacheKey.get(),
            identity: this.cmsContext.security.isAuthorizationEnabled()
                ? this.identityContext.getIdentity()?.id
                : undefined
        });

        const filteredDatabaseGroups = await this.groupCache.getOrSet(
            filteredCacheKey,
            async () => {
                return filterAsync(databaseGroups, async (group?: CmsGroup) => {
                    if (!group) {
                        return false;
                    }
                    return this.accessControl.canAccessGroup({ group });
                });
            }
        );

        // 4. Merge groups
        return [...filteredDatabaseGroups, ...pluginGroups];
    }
}

export const ListGroupsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: ListGroupsRepositoryImpl,
    dependencies: [
        GroupCache,
        PluginGroupsProvider,
        StorageOperations,
        AccessControl,
        TenantContext,
        IdentityContext,
        CmsContext
    ]
});
