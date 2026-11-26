import type { ObjectStorage } from "~/abstractions.js";

/**
 * A storage provider the shared contracts run against. Each provider package has one:
 * `@webiny/api-object-storage-disk` a temporary folder, `@webiny/api-object-storage-s3` a bucket.
 */
export interface ObjectStorageTestBackend {
    name: string;
    setup(): Promise<void>;
    cleanup(): Promise<void>;
    storage(): ObjectStorage.Interface;
}

/* S3 refuses multipart parts under 5 MiB, except the last one. */
export const MIN_PART_SIZE = 5 * 1024 * 1024;
