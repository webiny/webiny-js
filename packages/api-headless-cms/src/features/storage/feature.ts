import { createFeature } from "@webiny/feature/api";
import { StorageTransformRegistry } from "./StorageTransformRegistry.js";
import { DateStorageTransform } from "./fields/DateStorageTransform.js";

export const StorageFeature = createFeature({
    name: "Cms/StorageFeature",
    register: container => {
        
        container.register(DateStorageTransform);
        container.register(StorageTransformRegistry);
    }
});
