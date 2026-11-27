import { createFeature } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "./GlobalKeyValueStore.js";
import { KeyValueStore } from "./KeyValueStore.js";
import { KeyValueStoreRepository } from "./KeyValueStoreRepository.js";
import { KeyValueStorageOperations } from "./abstractions.js";

/**
 * Omit the storage operations to register `KeyValueStorageOperations` yourself (`ApiCoreFeature`
 * serves it from the tenant scope's core storage).
 */
export const KeyValueStoreFeature = createFeature<KeyValueStorageOperations.Interface | undefined>({
    name: "KeyValueStore",
    register(container, storageOperations) {
        // Register legacy storage operations
        if (storageOperations) {
            container.registerInstance(KeyValueStorageOperations, storageOperations);
        }

        container.register(KeyValueStoreRepository).inSingletonScope();
        container.register(GlobalKeyValueStore);
        container.register(KeyValueStore);
    }
});
