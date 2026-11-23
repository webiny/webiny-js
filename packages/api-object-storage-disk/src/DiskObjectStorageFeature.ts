import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import { DiskStorageConfig } from "./abstractions.js";
import { DiskObjectStorage } from "./DiskObjectStorage.js";

/**
 * Stores objects in a folder on disk. The standalone API registers it when
 * `WEBINY_LOCAL_STORAGE_PATH` is set; a project extension that provides another storage
 * (`<S3Storage />`) is registered after it, so that one wins.
 */
export const DiskObjectStorageFeature = createFeature({
    name: "ObjectStorage/Disk",
    register(container: Container, config: DiskStorageConfig.Interface) {
        container.registerInstance(DiskStorageConfig, config);
        container.register(DiskObjectStorage).inSingletonScope();
    }
});
