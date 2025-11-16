import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { Result } from "@webiny/feature/api";
import { ListModelsRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { filterAsync } from "~/utils/filterAsync.js";
import { createCacheKey } from "~/utils/index.js";
import type { CmsModel } from "~/types/index.js";
import type { ICmsModelListParams } from "~/types/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";

/**
 * ListModelsRepository - Fetches all models.
 *
 * Responsibilities:
 * - Create cache keys based on tenant + identity
 * - Provide data loader functions to ModelCache
 * - Fetch from plugin models + database models
 * - Apply access control filtering
 * - Apply includePrivate and includePlugins filters
 * - Ensure type tags
 * - Return all accessible models
 */
class ListModelsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelCache: ModelCache.Interface,
        private pluginModelsProvider: PluginModelsProvider.Interface,
        private storageOperations: StorageOperations.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(
        params?: ICmsModelListParams
    ): Promise<Result<CmsModel[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Default params
            const includePrivate = params?.includePrivate !== false; // defaults to true
            const includePlugins = params?.includePlugins !== false; // defaults to true

            // Fetch all models (plugin + database) with access control filtering
            let models = await this.fetchAllModels(tenant.id, includePlugins);

            // Filter out private models if requested
            if (!includePrivate) {
                models = models.filter(model => model.isPrivate !== true);
            }

            return Result.ok(models);
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }

    private async fetchAllModels(tenant: string, includePlugins: boolean): Promise<CmsModel[]> {
        // 1. Fetch plugin models (with caching and access control) if requested
        const pluginModels = includePlugins ? await this.pluginModelsProvider.list(tenant) : [];

        // 2. Fetch database models (with caching)
        const dbCacheKey = createCacheKey({ tenant });
        const databaseModels = await this.modelCache.getOrSet(dbCacheKey, () => {
            return this.storageOperations.models.list({ where: { tenant } });
        });

        // 3. Apply access control to database models (with caching)
        const filteredCacheKey = createCacheKey({
            dbCacheKey: dbCacheKey.get(),
            identity: this.identityContext.isAuthorizationEnabled()
                ? this.identityContext.getIdentity()?.id
                : undefined
        });

        const filteredDatabaseModels = await this.modelCache.getOrSet(filteredCacheKey, () => {
            return filterAsync(databaseModels, async (model: CmsModel) => {
                if (!model) {
                    return false;
                }
                return this.accessControl.canAccessModel({ model });
            });
        });

        // 4. Ensure type tags on database models
        const taggedDatabaseModels = filteredDatabaseModels.map(model => {
            model.tags = ensureTypeTag(model);
            return model;
        });

        // 5. Merge plugin + database models
        return [...pluginModels, ...taggedDatabaseModels];
    }
}

export const ListModelsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListModelsRepositoryImpl,
    dependencies: [
        ModelCache,
        PluginModelsProvider,
        StorageOperations,
        AccessControl,
        TenantContext,
        IdentityContext
    ]
});
