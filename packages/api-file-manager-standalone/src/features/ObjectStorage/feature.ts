import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import type { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { DiskStorageConfig } from "./abstractions.js";
import { DiskObjectStorage } from "./DiskObjectStorage.js";

/**
 * Stores files in a folder on disk, when one is configured. Without one, a project extension
 * registers the storage (`<S3FileStorage />`); extensions are registered after this, so theirs wins.
 */
export const ObjectStorageFeature = createFeature({
    name: "FileManagerServer/ObjectStorage",
    register(container: Container, config: FileManagerStandaloneConfig.Interface) {
        if (!config.storagePath) {
            return;
        }
        container.registerInstance(DiskStorageConfig, { path: config.storagePath });
        container.register(DiskObjectStorage).inSingletonScope();
    }
});
