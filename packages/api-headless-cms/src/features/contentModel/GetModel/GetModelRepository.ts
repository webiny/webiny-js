import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { Result } from "@webiny/feature/api";
import { GetModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { ModelNotFoundError } from "~/domain/contentModel/errors.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { filterAsync } from "~/utils/filterAsync.js";
import { createCacheKey } from "~/utils/index.js";
import type { CmsModel } from "~/types/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";

/**
 * GetModelRepository - Fetches a single model by ID.
 *
 * Responsibilities:
 * - Create cache keys based on tenant + locale + identity
 * - Provide data loader functions to ModelCache
 * - Fetch from plugin models + database models
 * - Apply access control filtering
 * - Ensure type tags
 * - Return the model or NotFoundError
 */
class GetModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private modelCache: ModelCache.Interface,
        private pluginModelsProvider: PluginModelsProvider.Interface,
        private storageOperations: StorageOperations.Interface,
        private accessControl: AccessControl.Interface,
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private cmsContext: CmsContext.Interface
    ) {}

    async execute(modelId: string): Promise<Result<CmsModel, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();
            const locale = this.cmsContext.getLocale();

            // Fetch all models (plugin + database) with access control filtering
            const models = await this.fetchAllModels(tenant.id, locale.code);

            const model = models.find(m => m.modelId === modelId);

            if (!model) {
                return Result.fail(new ModelNotFoundError(modelId));
            }

            return Result.ok(model);
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }

    private async fetchAllModels(tenant: string, locale: string): Promise<CmsModel[]> {
        // 1. Fetch plugin models (with caching and access control)
        const pluginModels = await this.pluginModelsProvider.list(tenant);

        // 2. Fetch database models (with caching)
        const dbCacheKey = createCacheKey({ tenant, locale });
        const databaseModels = await this.modelCache.getOrSet(dbCacheKey, async () => {
            return await this.storageOperations.models.list({
                where: { tenant, locale }
            });
        });

        // 3. Apply access control to database models (with caching)
        const filteredCacheKey = createCacheKey({
            dbCacheKey: dbCacheKey.get(),
            identity: this.cmsContext.security.isAuthorizationEnabled()
                ? this.identityContext.getIdentity()?.id
                : undefined
        });

        const filteredDatabaseModels = await this.modelCache.getOrSet(
            filteredCacheKey,
            async () => {
                return filterAsync(databaseModels, async (model?: CmsModel) => {
                    if (!model) {
                        return false;
                    }
                    return this.accessControl.canAccessModel({ model });
                });
            }
        );

        // 4. Ensure type tags on database models
        const taggedDatabaseModels = filteredDatabaseModels.map(model => {
            model.tags = ensureTypeTag(model);
            return model;
        });

        // 5. Merge plugin + database models
        return [...pluginModels, ...taggedDatabaseModels];
    }
}

export const GetModelRepository = RepositoryAbstraction.createImplementation({
    implementation: GetModelRepositoryImpl,
    dependencies: [
        ModelCache,
        PluginModelsProvider,
        StorageOperations,
        AccessControl,
        TenantContext,
        IdentityContext,
        CmsContext
    ]
});
