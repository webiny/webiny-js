import type { HcmsTasksContext } from "~/types.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { DbInstance } from "@webiny/handler-db/abstractions.js";
import { createCacheKey } from "@webiny/api-headless-cms/utils/index.js";
import { createMemoryCache } from "@webiny/api-headless-cms/utils/index.js";
import type { IStoreValue } from "~/features/DeleteModelTask/types.js";
import type { ListStoreKeysResult } from "~/features/DeleteModelTask/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { ContextPlugin } from "@webiny/api";
import { DisableModelFeature } from "~/features/DisableModel/feature.js";
import { createStoreNamespace } from "~/helpers/store.js";
import { fullyDeleteModel } from "~/graphql/deleteModel/fullyDeleteModel.js";
import { cancelDeleteModel } from "~/graphql/deleteModel/cancelDeleteModel.js";
import { getDeleteModelProgress } from "~/graphql/deleteModel/getDeleteModelProgress.js";
import { DeleteModelOperations } from "~/graphql/deleteModel/abstractions.js";

export const createDeleteModelCrud = () => {
    const plugin = new ContextPlugin<HcmsTasksContext>(async context => {
        const getTenant = (): string => {
            return context.container.resolve(TenantContext).getTenant().id;
        };

        const cache = createMemoryCache<ListStoreKeysResult>();

        const listModelsBeingDeleted = async (): Promise<IStoreValue[]> => {
            const tenant = getTenant();
            const cacheKey = createCacheKey({
                tenant: getTenant(),
                type: "deleteModel"
            });

            const result = await cache.getOrSet(cacheKey, async () => {
                const beginsWith = createStoreNamespace({
                    tenant
                });
                return await context.container
                    .resolve(DbInstance)
                    .store.listValues<GenericRecord<string, IStoreValue>>({
                        beginsWith
                    });
            });

            if (result.error) {
                throw result.error;
            } else if (!result.data) {
                return [];
            }
            return Object.values(result.data);
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
    });

    plugin.name = "headlessCms.context.cms.fullyDeleteModel";

    return plugin;
};
