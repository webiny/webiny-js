import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { createCacheKey, createMemoryCache } from "@webiny/api-headless-cms/utils/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AbortTaskUseCase, GetTaskUseCase, TriggerTaskUseCase } from "@webiny/background-tasks/api";
import type { IStoreValue } from "~/features/DeleteModelTask/types.js";
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
 */
class DeleteModelOperationsImpl implements DeleteModelOperations.Interface {
    private readonly cache = createMemoryCache<Promise<IStoreValue[]>>();

    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly getModel: GetModelUseCase.Interface,
        private readonly accessControl: AccessControl.Interface,
        private readonly triggerTask: TriggerTaskUseCase.Interface,
        private readonly getTask: GetTaskUseCase.Interface,
        private readonly abortTask: AbortTaskUseCase.Interface
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
        const result = await fullyDeleteModel({
            getModel: this.getModel,
            accessControl: this.accessControl,
            keyValueStore: this.keyValueStore,
            triggerTask: this.triggerTask,
            identityContext: this.identityContext,
            modelId
        });
        this.cache.clear();
        return result;
    }

    async cancelFullyDeleteModel(modelId: string) {
        const result = await cancelDeleteModel({
            getModel: this.getModel,
            accessControl: this.accessControl,
            keyValueStore: this.keyValueStore,
            getTask: this.getTask,
            abortTask: this.abortTask,
            modelId
        });
        this.cache.clear();
        return result;
    }

    async getDeleteModelProgress(modelId: string) {
        return getDeleteModelProgress({
            getModel: this.getModel,
            accessControl: this.accessControl,
            keyValueStore: this.keyValueStore,
            getTask: this.getTask,
            modelId
        });
    }

    private getTenant(): string {
        return this.tenantContext.getTenant().id;
    }

    private getStore() {
        return createDeleteModelStore(this.keyValueStore, this.getTenant());
    }
}

export const DeleteModelOperationsImplementation = DeleteModelOperations.createImplementation({
    implementation: DeleteModelOperationsImpl,
    dependencies: [
        TenantContext,
        GlobalKeyValueStore,
        IdentityContext,
        GetModelUseCase,
        AccessControl,
        TriggerTaskUseCase,
        GetTaskUseCase,
        AbortTaskUseCase
    ]
});
