import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/feature/api";
import type { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { DiskStorageConfig } from "./abstractions.js";
import { S3StorageConfig } from "./abstractions.js";
import { DiskObjectStorage } from "./DiskObjectStorage.js";
import { S3ObjectStorage } from "./S3ObjectStorage.js";

/** Stores files on disk or in an S3-compatible bucket, as `config.storage` says. */
export const ObjectStorageFeature = createFeature({
    name: "FileManagerServer/ObjectStorage",
    register(container: Container, config: FileManagerStandaloneConfig.Interface) {
        if (config.storage.type === "s3") {
            container.registerInstance(S3StorageConfig, config.storage);
            container.register(S3ObjectStorage).inSingletonScope();
            return;
        }
        container.registerInstance(DiskStorageConfig, config.storage);
        container.register(DiskObjectStorage).inSingletonScope();
    }
});
