import { createFeature } from "@webiny/feature/api";
import { ModelStorageSyncTaskDefinition } from "./ModelStorageSyncTask.js";
import { SyncStorageOnModelUpdate } from "./SyncStorageOnModelUpdate.js";

/**
 * Keeps a storage's indexes in line with model changes, in the background (model changes spec).
 * The storage registers `ModelStorageSync`; without one, nothing runs.
 */
export const ModelStorageSyncFeature = createFeature({
    name: "Cms/ModelStorageSync",
    register(container) {
        container.register(ModelStorageSyncTaskDefinition);
        container.register(SyncStorageOnModelUpdate);
    }
});
