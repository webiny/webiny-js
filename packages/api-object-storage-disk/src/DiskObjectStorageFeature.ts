import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { DiskStorageConfig } from "./abstractions.js";
import { DiskObjectStorage } from "./DiskObjectStorage.js";

/**
 * Stores objects in a folder on disk. `DiskStorageExtension` registers it, for the folder in
 * `WEBINY_LOCAL_STORAGE_PATH`.
 */
export const DiskObjectStorageFeature = createFeature({
    name: "ObjectStorage/Disk",
    register(container: Container, config: DiskStorageConfig.Interface) {
        container.registerInstance(DiskStorageConfig, config);
        container.register(DiskObjectStorage).inSingletonScope();
    }
});
