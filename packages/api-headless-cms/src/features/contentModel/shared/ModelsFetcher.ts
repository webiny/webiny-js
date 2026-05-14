import { Result } from "@webiny/feature/api";
import {
    ModelCache,
    ModelsFetcher as FetcherAbstraction
} from "~/features/contentModel/shared/abstractions.js";
import { PluginModelsProvider } from "~/features/contentModel/shared/abstractions.js";
import { StorageOperations } from "~/features/shared/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ModelNotFoundError, ModelPersistenceError } from "~/domain/contentModel/errors.js";
import { createCacheKey } from "~/utils/index.js";
import { ensureTypeTag } from "~/domain/contentModel/ensureTypeTag.js";
import type { CmsModel } from "~/types/index.js";
import { ModelFieldCompression } from "~/features/contentModel/ModelFieldCompression/index.js";

/**
 * ModelsFetcherImpl - Implementation with multi-level caching.
 *
 * Caching strategy:
 * - Plugin models: resolved fresh on every call (set grows as ContextPlugins run)
 * - Database models: cached per tenant (raw from DB, stable within a request)
 */
class ModelsFetcherImpl implements FetcherAbstraction.Interface {
    public constructor(
        private readonly modelCache: ModelCache.Interface,
        private readonly pluginModelsProvider: PluginModelsProvider.Interface,
        private readonly storageOperations: StorageOperations.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly modelFieldCompression: ModelFieldCompression.Interface
    ) {}

    async fetchAll(): Promise<Result<CmsModel[], FetcherAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Plugin models are resolved fresh on every call because ContextPlugins
            // may register ModelFactory implementations at any point during request
            // initialization. Caching here would freeze the list at whatever was
            // registered at the time of the first call, causing models registered
            // by later ContextPlugins (e.g. Webiny Task) to be silently omitted.
            const pluginModels = await this.pluginModelsProvider.list(tenant.id);

            // DB models are stable within a request — cache them per tenant.
            const databaseModels = await this.fetchAndMergeModels(tenant.id);

            return Result.ok([...pluginModels, ...databaseModels]);
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
            const models = await this.storageOperations.models.list({ where: { tenant } });

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
        StorageOperations,
        TenantContext,
        ModelFieldCompression
    ]
});
