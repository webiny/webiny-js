import { createFeature } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "./GlobalKeyValueStore.js";
import { KeyValueStore } from "./KeyValueStore.js";
import { KeyValueStoreRepository } from "./KeyValueStoreRepository.js";

export const KeyValueStoreFeature = createFeature({
    name: "KeyValueStore",
    register(container) {
        container.register(KeyValueStoreRepository).inSingletonScope();
        container.register(GlobalKeyValueStore);
        container.register(KeyValueStore);
    }
});
