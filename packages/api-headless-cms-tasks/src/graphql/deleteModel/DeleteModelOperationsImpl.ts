import type { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import { createCacheKey, createMemoryCache } from "@webiny/api-headless-cms/utils/index.js";
import type { IStoreValue } from "~/features/DeleteModelTask/types.js";
import type { HcmsTasksContext } from "~/types.js";
import { createDeleteModelStore } from "~/helpers/store.js";
import { fullyDeleteModel } from "~/graphql/deleteModel/fullyDeleteModel.js";
import { cancelDeleteModel } from "~/graphql/deleteModel/cancelDeleteModel.js";
import { getDeleteModelProgress } from "~/graphql/deleteModel/getDeleteModelProgress.js";
import { DeleteModelOperations } from "~/graphql/deleteModel/abstractions.js";

/**
 * Delete-model operations, previously assembled inside a `RequestContextInitializer`
 * (`createDeleteModelCrud`) from closures over the request context.
 *
 * Nothing here needed a per-request hook: every member is already async, and the tenant is read
 * lazily at call time rather than at construction. As an ordinary DI implementation it is
 * sync-constructible, which also lets `DisableModelFeature` keep resolving it at register time.
 *
 * The in-memory cache is KEPT. Unlike the CMS model providers — where `ModelsFetcher`/`ModelCache`
 * already cached a layer down — nothing caches these key-value reads, so without it every
 * `isModelBeingDeleted()` check would hit the store. It is cleared on mutation, as before.
 *
 * `RequestContainer` is injected only to hand a `{ container }` context to `fullyDeleteModel`,
 * `cancelDeleteModel` and `getDeleteModelProgress`, which service-locate their own dependencies
 * (`GetModelUseCase`, `AccessControl`, `TriggerTaskUseCase`, `GetTaskUseCase`, `AbortTaskUseCase`,
 * `IdentityContext`, `GlobalKeyValueStore`). Converting those three helpers to declare their
 * dependencies is a separate change — it touches ~271 lines across three files and is orthogonal to
 * retiring the initializer.
 */
class DeleteModelOperationsImpl implements DeleteModelOperations.Interface {
    private readonly cache = createMemoryCache<Promise<IStoreValue[]>>();

    constructor(
        private readonly container: Container,
        private readonly tenantContext: TenantContext.Interface,
        private readonly keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async listModelsBeingDeleted(): Promise<IStoreValue[]> {
        const cacheKey = createCacheKey({ tenant: this.getTenant(), type: "deleteModel" });
        return this.cache.getOrSet(cacheKey, () => this.getStore().list());
    }

    async isModelBeingDeleted(modelId: string): Promise<boolean> {
        const items = await this.listModelsBeingDeleted();
        return items.some(item => item.modelId === modelId);
    }

    async fullyDeleteModel(modelId: string) {
        const result = await fullyDeleteModel({ context: this.context(), modelId });
        this.cache.clear();
        return result;
    }

    async cancelFullyDeleteModel(modelId: string) {
        const result = await cancelDeleteModel({ context: this.context(), modelId });
        this.cache.clear();
        return result;
    }

    async getDeleteModelProgress(modelId: string) {
        return getDeleteModelProgress({ context: this.context(), modelId });
    }

    private getTenant(): string {
        return this.tenantContext.getTenant().id;
    }

    private getStore() {
        return createDeleteModelStore(this.keyValueStore, this.getTenant());
    }

    private context(): HcmsTasksContext {
        return { container: this.container } as HcmsTasksContext;
    }
}

export const DeleteModelOperationsImplementation = DeleteModelOperations.createImplementation({
    implementation: DeleteModelOperationsImpl,
    dependencies: [RequestContainer, TenantContext, GlobalKeyValueStore]
});
