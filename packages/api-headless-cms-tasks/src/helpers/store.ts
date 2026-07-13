import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { IStoreValue } from "~/features/DeleteModelTask/types.js";

/**
 * A single key per tenant holds the map of models currently being deleted (modelId -> record). The
 * api-core key-value store is get/set/delete only (no prefix scan), so we keep ONE map entry and
 * enumerate in memory rather than one entry per model. Tenant isolation comes from the store scope.
 */
const STORE_KEY = "cmsModelsBeingDeleted";

type StoreMap = Record<string, IStoreValue>;

export const createStoreValue = (params: IStoreValue): IStoreValue => {
    return {
        modelId: params.modelId,
        task: params.task,
        identity: params.identity,
        tenant: params.tenant
    };
};

export interface IDeleteModelStore {
    list(): Promise<IStoreValue[]>;
    get(modelId: string): Promise<IStoreValue | null>;
    set(value: IStoreValue): Promise<void>;
    remove(modelId: string): Promise<void>;
}

/**
 * Delete-model tracking store, backed by the flavour-agnostic api-core key-value store (registered
 * by both the DynamoDB and SQL cores). Replaces the old `@webiny/db` `DbInstance.store`.
 */
export const createDeleteModelStore = (
    store: GlobalKeyValueStore.Interface,
    tenant: string
): IDeleteModelStore => {
    const options = { scope: tenant };

    const readMap = async (): Promise<StoreMap> => {
        const result = await store.get<StoreMap>(STORE_KEY, options);
        // A missing key is a failed Result (KeyNotFound) — treat as an empty map.
        return result.isFail() ? {} : (result.value ?? {});
    };

    const writeMap = (map: StoreMap): Promise<void> => {
        return store.set(STORE_KEY, map, options).then(() => undefined);
    };

    return {
        async list() {
            return Object.values(await readMap());
        },
        async get(modelId) {
            const map = await readMap();
            return map[modelId] ?? null;
        },
        async set(value) {
            const map = await readMap();
            map[value.modelId] = value;
            await writeMap(map);
        },
        async remove(modelId) {
            const map = await readMap();
            if (!(modelId in map)) {
                return;
            }
            delete map[modelId];
            await writeMap(map);
        }
    };
};
