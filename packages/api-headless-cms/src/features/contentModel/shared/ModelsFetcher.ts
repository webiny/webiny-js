import { Result } from "@webiny/feature/api";
import {
    ModelCache,
    ModelsFetcher as FetcherAbstraction
} from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { ModelNotFoundError, ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { createCacheKey } from "~/utils/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";
import type { CmsModel } from "~/types/index.js";

/**
 * ModelsFetcherImpl - Implementation with multi-level caching.
 *
 * Caching strategy:
 * 1. Plugin models are cached per tenant (with access control applied by PluginModelsProvider)
 * 2. Database models are cached per tenant (raw from DB)
 * 3. Filtered database models are cached per tenant + identity (with access control applied)
 * 4. Final merged list is cached per tenant + identity
 */
class ModelsFetcherImpl implements FetcherAbstraction.Interface {
    public constructor(
        private modelCache: ModelCache.Interface,
        private pluginModelsProvider: PluginModelsProvider.Interface,
        private storageOperations: StorageOperations.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async fetchAll(): Promise<Result<CmsModel[], FetcherAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Create a cache key based on tenant + identity
            const cacheKey = createCacheKey({
                tenant: tenant.id
            });

            // Fetch plugin models (with caching and access control)
            const pluginModels = await this.pluginModelsProvider.list(tenant.id);

            // Try to get from cache first
            const cached = await this.modelCache.getOrSet(cacheKey, async () => {
                return this.fetchAndMergeModels(tenant.id);
            });

            return Result.ok([...cached, ...pluginModels]);
        } catch (error) {
            return Result.fail(new ModelPersistenceError(error as Error));
        }
    }

    async fetchById(modelId: string): Promise<Result<CmsModel, FetcherAbstraction.Error>> {
        const result = await this.fetchAll();
        if (result.isFail()) {
            return Result.fail(new ModelPersistenceError(result.error));
        }

        const model = result.value.find(m => m.modelId === modelId);
        if (!model) {
            return Result.fail(new ModelNotFoundError(modelId));
        }

        return Result.ok(model);
    }

    private async fetchAndMergeModels(tenant: string): Promise<CmsModel[]> {
        // 1. Fetch database models (with caching)
        const dbCacheKey = createCacheKey({ tenant, id: "storage" });
        const databaseModels = await this.modelCache.getOrSet(dbCacheKey, async () => {
            return this.storageOperations.models.list({ where: { tenant } });
        });

        // 2. Ensure type tags on database models
        const taggedDatabaseModels = databaseModels.map(model => {
            model.tags = ensureTypeTag(model);
            return model;
        });

        // 3. Return merged models.
        return taggedDatabaseModels;
    }
}

export const ModelsFetcher = FetcherAbstraction.createImplementation({
    implementation: ModelsFetcherImpl,
    dependencies: [ModelCache, PluginModelsProvider, StorageOperations, TenantContext]
});
