import { createFeature } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "./GlobalKeyValueStore.js";
import { KeyValueStore } from "./KeyValueStore.js";
import { KeyValueStoreRepository } from "./KeyValueStoreRepository.js";
import { KeyValueStorageOperations } from "./abstractions.js";

export const KeyValueStoreFeature = createFeature<KeyValueStorageOperations.Interface>({
    name: "KeyValueStore",
    register(container, storageOperations) {
        // Register legacy storage operations
        container.registerInstance(KeyValueStorageOperations, storageOperations);

        container.register(KeyValueStoreRepository).inSingletonScope();
        container.register(GlobalKeyValueStore);
        container.register(KeyValueStore);
    }
});
