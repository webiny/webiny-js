import { createFeature } from "@webiny/feature/api";
import { S3StorageConfig } from "./abstractions.js";
import { readS3StorageConfig } from "./readS3StorageConfig.js";
import { S3ObjectStorage } from "./S3ObjectStorage.js";

let config: S3StorageConfig.Interface | undefined;

/* The env is read once per process. */
const getConfig = (): S3StorageConfig.Interface => {
    if (!config) {
        config = readS3StorageConfig(process.env);
    }
    return config;
};

/**
 * The API extension `<Infra.FileStorage.S3 />` adds to the project, registered in each request's
 * container. Its own module, so the API bundle imports only the storage, not the project extension.
 */
export const S3StorageExtension = createFeature({
    name: "S3StorageExtension",
    register(container) {
        const s3Config = getConfig();
        container.registerInstance(S3StorageConfig, s3Config);
        container.register(S3ObjectStorage).inSingletonScope();
    }
});
