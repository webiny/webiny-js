import type { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import type { ObjectStorageTestBackend } from "../../../api-object-storage/__tests__/contracts/ObjectStorageTestBackend.js";
import { diskBackend as diskStorageBackend } from "../../../api-object-storage-disk/__tests__/diskBackend.js";
import { s3Backend as s3StorageBackend } from "../../../api-object-storage-s3/__tests__/s3Backend.js";
import { s3Endpoint } from "../../../api-object-storage-s3/__tests__/s3Backend.js";
import { SECRET } from "./helpers.js";

export { MIN_PART_SIZE } from "../../../api-object-storage/__tests__/contracts/ObjectStorageTestBackend.js";

/**
 * A storage the storage-independent tests run against: a provider's test backend, plus the upload
 * settings. Always a folder on disk; also an S3-compatible bucket when `WEBINY_TEST_S3_ENDPOINT` is
 * set (see `@webiny/api-object-storage-s3`'s `s3Backend`).
 */
export interface TestStorageBackend extends ObjectStorageTestBackend {
    config(): FileManagerStandaloneConfig.Interface;
}

const withUploadConfig = (backend: ObjectStorageTestBackend): TestStorageBackend => {
    return {
        name: backend.name,
        setup: () => backend.setup(),
        cleanup: () => backend.cleanup(),
        storage: () => backend.storage(),
        config: () => ({ uploadSecret: SECRET })
    };
};

export const diskBackend = withUploadConfig(diskStorageBackend);

export const storageBackends: TestStorageBackend[] = [diskBackend];
if (s3Endpoint) {
    storageBackends.push(withUploadConfig(s3StorageBackend));
}
