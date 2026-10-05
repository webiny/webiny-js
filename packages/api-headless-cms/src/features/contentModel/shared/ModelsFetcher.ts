import { Result } from "@webiny/feature/api";
import {
    ModelCache,
    ModelsFetcher as FetcherAbstraction
} from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { ListModelsStorageOperation } from "~/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ModelNotFoundError, ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { createCacheKey } from "~/utils/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";
import type { CmsModel } from "~/types/index.js";
import { ModelFieldCompression } from "~/features/contentModel/ModelFieldCompression/index.js";

/**
 * ModelsFetcherImpl - Implementation with multi-level caching.
 *
 * Caching strategy (per request, see ModelCache):
 * 1. Database models are cached per tenant (raw from DB)
 * 2. The merged list of plugin and database models is cached per tenant
 *
 * Neither list is filtered by access control, so the cache is the same whoever reads it first.
 * GetModelUseCase and ListModelsUseCase apply access control to what they return.
 */
class ModelsFetcherImpl implements FetcherAbstraction.Interface {
    public constructor(
        private readonly modelCache: ModelCache.Interface,
        private readonly pluginModelsProvider: PluginModelsProvider.Interface,
        private readonly listModels: ListModelsStorageOperation.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly modelFieldCompression: ModelFieldCompression.Interface
    ) {}

    async fetchAll(): Promise<Result<CmsModel[], FetcherAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            const cacheKey = createCacheKey({
                tenant: tenant.id
            });

            // Try to get from cache first
            const cached = await this.modelCache.getOrSet(cacheKey, async () => {
                // Fetch plugin models (with caching and access control)
                const pluginModels = await this.pluginModelsProvider.list(tenant.id);

                const databaseModels = await this.fetchAndMergeModels(tenant.id);

                return [...pluginModels, ...databaseModels];
            });

            return Result.ok(cached);
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
            const models = await this.listModels.execute({ where: { tenant } });

            return Promise.all(
                models.map(async model => {
                    const fields = await this.modelFieldCompression.decompress(model.fields);

                    return {
                        ...model,
                        fields
                    };
                })
            );
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
    dependencies: [
        ModelCache,
        PluginModelsProvider,
        ListModelsStorageOperation,
        TenantContext,
        ModelFieldCompression
    ]
});
