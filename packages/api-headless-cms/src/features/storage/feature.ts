import { createFeature } from "@webiny/feature/api";
import { StorageTransformRegistry } from "./StorageTransformRegistry.js";

export const StorageFeature = createFeature({
    name: "Cms/StorageFeature",
    register: container => {
        container.register(StorageTransformRegistry);
    }
});
