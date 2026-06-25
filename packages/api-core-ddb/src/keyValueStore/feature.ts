import { createFeature } from "@webiny/feature/api";
import { KeyValueStorageOperations } from "./KeyValueStoreStorageOperations.js";

export const KeyValueStoreApiCoreDdbFeature = createFeature({
    name: "ApiCoreDdb/KeyValueStore",
    register: container => {
        container.register(KeyValueStorageOperations).inSingletonScope();
    }
});
