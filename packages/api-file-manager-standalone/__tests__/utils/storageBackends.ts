import { randomUUID } from "node:crypto";
import type { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import type { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";
import { DiskObjectStorage } from "~/features/ObjectStorage/DiskObjectStorage.js";
import { S3ObjectStorage } from "~/features/ObjectStorage/S3ObjectStorage.js";
import { cleanupStorage } from "./helpers.js";
import { SECRET } from "./helpers.js";
import { setupStorage } from "./helpers.js";

/**
 * A storage the storage-independent tests run against. Disk always runs. S3 runs when
 * `WEBINY_TEST_S3_ENDPOINT` points at an S3-compatible server with an existing bucket, e.g.
 * SeaweedFS, with an `s3.json` that gives the key pair below admin rights:
 *
 *   docker run -d -p 8333:8333 -v $PWD/s3.json:/etc/s3.json chrislusf/seaweedfs \
 *     server -s3 -s3.config=/etc/s3.json -dir=/data
 *   (create the bucket `webiny-test` with any S3 client)
 *   WEBINY_TEST_S3_ENDPOINT=http://localhost:8333 WEBINY_TEST_S3_BUCKET=webiny-test \
 *   WEBINY_TEST_S3_ACCESS_KEY_ID=test WEBINY_TEST_S3_SECRET_ACCESS_KEY=test123 yarn test ...
 *
 * Without `WEBINY_TEST_S3_ACCESS_KEY_ID`, the AWS SDK's default credential chain is used (e.g.
 * `AWS_PROFILE`), with `WEBINY_TEST_S3_REGION` for the bucket's region. Every S3 test works under a
 * prefix of its own, removed afterwards.
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

const diskBackend: TestStorageBackend = {
    name: "disk",
    async setup() {
        diskPath = await setupStorage();
        diskConfig = { storage: { type: "disk", path: diskPath }, uploadSecret: SECRET };
    },
    async cleanup() {
        await cleanupStorage();
    },
    config() {
        return diskConfig;
    },
    storage() {
        return new DiskObjectStorage({ type: "disk", path: diskPath });
    }
};

let s3Config: FileManagerStandaloneConfig.Interface;
let s3StorageConfig: FileManagerStandaloneConfig.S3Storage;

const readTestCredentials = (): FileManagerStandaloneConfig.S3Storage["credentials"] => {
    const accessKeyId = process.env.WEBINY_TEST_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.WEBINY_TEST_S3_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
        return undefined;
    }
    return { accessKeyId, secretAccessKey };
};

const createS3Backend = (endpoint: string): TestStorageBackend => {
    return {
        name: "s3",
        async setup() {
            s3StorageConfig = {
                type: "s3",
                bucket: process.env.WEBINY_TEST_S3_BUCKET || "webiny-test",
                region: process.env.WEBINY_TEST_S3_REGION || "us-east-1",
                endpoint,
                forcePathStyle: true,
                prefix: `test-${randomUUID()}/`,
                credentials: readTestCredentials()
            };
            s3Config = { storage: s3StorageConfig, uploadSecret: SECRET };
        },
        async cleanup() {
            const storage = new S3ObjectStorage(s3StorageConfig);
            await storage.deletePrefix("tenants/");
            const inAMinute = new Date(Date.now() + 60_000);
            await storage.abortMultipartUploads({ prefix: "tenants/", startedBefore: inAMinute });
        },
        config() {
            return s3Config;
        },
        storage() {
            return new S3ObjectStorage(s3StorageConfig);
        }
    };
};

const s3Endpoint = process.env.WEBINY_TEST_S3_ENDPOINT;

export const storageBackends: TestStorageBackend[] = [diskBackend];
if (s3Endpoint) {
    storageBackends.push(createS3Backend(s3Endpoint));
}

/* S3 refuses multipart parts under 5 MiB, except the last one. */
export const MIN_PART_SIZE = 5 * 1024 * 1024;
