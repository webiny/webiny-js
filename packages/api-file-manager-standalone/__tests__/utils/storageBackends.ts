import type { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import type { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";
import { DiskObjectStorage } from "~/features/ObjectStorage/DiskObjectStorage.js";
import { cleanupStorage } from "./helpers.js";
import { SECRET } from "./helpers.js";
import { setupStorage } from "./helpers.js";

/**
 * A storage the storage-independent tests run against. This package runs them on disk;
 * `@webiny/api-file-manager-standalone-s3` runs the contracts in `../contracts` on an S3-compatible
 * bucket with a backend of its own.
 */
export interface TestStorageBackend {
    name: string;
    setup(): Promise<void>;
    cleanup(): Promise<void>;
    config(): FileManagerStandaloneConfig.Interface;
    storage(): ObjectStorage.Interface;
}

let diskConfig: FileManagerStandaloneConfig.Interface;
let diskPath: string;

export const diskBackend: TestStorageBackend = {
    name: "disk",
    async setup() {
        diskPath = await setupStorage();
        diskConfig = { storagePath: diskPath, uploadSecret: SECRET };
    },
    async cleanup() {
        await cleanupStorage();
    },
    config() {
        return diskConfig;
    },
    storage() {
        return new DiskObjectStorage({ path: diskPath });
    }
};

export const storageBackends: TestStorageBackend[] = [diskBackend];

/* S3 refuses multipart parts under 5 MiB, except the last one. */
export const MIN_PART_SIZE = 5 * 1024 * 1024;
