import type { HcmsTasksContext } from "~/types.js";
import { fullyDeleteModel as fullyDeleteModelMethod } from "./fullyDeleteModel.js";
import { cancelDeleteModel } from "./cancelDeleteModel.js";
import { getDeleteModelProgress as getDeleteModelProgressMethod } from "./getDeleteModelProgress.js";
import { createCacheKey, createMemoryCache } from "@webiny/api-headless-cms/utils/index.js";
import type { IStoreValue, ListStoreKeysResult } from "../types.js";
import { createStoreNamespace } from "~/tasks/deleteModel/helpers/store.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { ContextPlugin } from "@webiny/api";
import { attachLifecycleEvents } from "./attachLifecycleEvents.js";

export const createDeleteModelCrud = () => {
    const plugin = new ContextPlugin<HcmsTasksContext>(async context => {
        attachLifecycleEvents({
            context
        });

        const getTenant = (): string => {
            return context.tenancy.getCurrentTenant().id;
        };

        const cache = createMemoryCache<ListStoreKeysResult>();

        context.cms.listModelsBeingDeleted = async () => {
            const tenant = getTenant();
            const cacheKey = createCacheKey({
                tenant: getTenant(),
                type: "deleteModel"
            });

            const result = await cache.getOrSet(cacheKey, async () => {
                const beginsWith = createStoreNamespace({
                    tenant
                });
                return await context.db.store.listValues<GenericRecord<string, IStoreValue>>({
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

        context.cms.isModelBeingDeleted = async (modelId: string) => {
            const items = await context.cms.listModelsBeingDeleted();
            return items.some(item => item.modelId === modelId);
        };
        context.cms.fullyDeleteModel = async (modelId: string) => {
            const result = await fullyDeleteModelMethod({
                context,
                modelId
            });
            cache.clear();
            return result;
        };

        context.cms.cancelFullyDeleteModel = async (modelId: string) => {
            const result = await cancelDeleteModel({
                context,
                modelId
            });
            cache.clear();
            return result;
        };

        context.cms.getDeleteModelProgress = async (modelId: string) => {
            return await getDeleteModelProgressMethod({
                context,
                modelId
            });
        };
    });

    plugin.name = "headlessCms.context.cms.fullyDeleteModel";

    return plugin;
};
