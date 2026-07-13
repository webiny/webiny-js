import type { HcmsTasksContext } from "~/types.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import { createCacheKey } from "@webiny/api-headless-cms/utils/index.js";
import { createMemoryCache } from "@webiny/api-headless-cms/utils/index.js";
import type { IStoreValue } from "~/features/DeleteModelTask/types.js";
import type { RequestContextInitializer } from "@webiny/event-handler-core";
import { DisableModelFeature } from "~/features/DisableModel/feature.js";
import { createDeleteModelStore } from "~/helpers/store.js";
import { fullyDeleteModel } from "~/graphql/deleteModel/fullyDeleteModel.js";
import { cancelDeleteModel } from "~/graphql/deleteModel/cancelDeleteModel.js";
import { getDeleteModelProgress } from "~/graphql/deleteModel/getDeleteModelProgress.js";
import { DeleteModelOperations } from "~/graphql/deleteModel/abstractions.js";

export const createDeleteModelCrud = (): RequestContextInitializer.Interface => ({
    async init(context: HcmsTasksContext) {
        const getTenant = (): string => {
            return context.container.resolve(TenantContext).getTenant().id;
        };

        const getStore = () => {
            return createDeleteModelStore(
                context.container.resolve(GlobalKeyValueStore),
                getTenant()
            );
        };

        const cache = createMemoryCache<Promise<IStoreValue[]>>();

        const listModelsBeingDeleted = async (): Promise<IStoreValue[]> => {
            const cacheKey = createCacheKey({
                tenant: getTenant(),
                type: "deleteModel"
            });

            return cache.getOrSet(cacheKey, () => getStore().list());
        };

        const isModelBeingDeleted = async (modelId: string): Promise<boolean> => {
            const items = await listModelsBeingDeleted();
            return items.some(item => item.modelId === modelId);
        };

        const operations: DeleteModelOperations.Interface = {
            listModelsBeingDeleted,
            isModelBeingDeleted,
            fullyDeleteModel: async (modelId: string) => {
                const result = await fullyDeleteModel({ context, modelId });
                cache.clear();
                return result;
            },
            cancelFullyDeleteModel: async (modelId: string) => {
                const result = await cancelDeleteModel({ context, modelId });
                cache.clear();
                return result;
            },
            getDeleteModelProgress: async (modelId: string) => {
                return getDeleteModelProgress({ context, modelId });
            }
        };

        context.container.registerInstance(DeleteModelOperations, operations);

        DisableModelFeature.register(context.container);
    }
});
