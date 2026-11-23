import { createFeature } from "@webiny/feature/api";
import type { DiskStorageConfig } from "./abstractions.js";
import { DiskObjectStorageFeature } from "./DiskObjectStorageFeature.js";
import { readDiskStorageConfig } from "./readDiskStorageConfig.js";

let config: DiskStorageConfig.Interface | undefined;

/* The env is read once per process. */
const getConfig = (): DiskStorageConfig.Interface => {
    if (!config) {
        config = readDiskStorageConfig(process.env);
    }
    return config;
};

/**
 * The API extension `<DiskStorage />` adds to the project (`<Infra.FileStorage path="..." />`
 * renders it). Its own module, so the API bundle imports only the storage, not the project
 * extension.
 */
export const DiskStorageExtension = createFeature({
    name: "DiskStorageExtension",
    register(container) {
        DiskObjectStorageFeature.register(container, getConfig());
    }
});
