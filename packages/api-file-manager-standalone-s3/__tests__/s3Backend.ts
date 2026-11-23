import { randomUUID } from "node:crypto";
import type { TestStorageBackend } from "../../api-file-manager-standalone/__tests__/utils/storageBackends.js";
import { SECRET } from "../../api-file-manager-standalone/__tests__/utils/helpers.js";
import type { S3StorageConfig } from "~/abstractions.js";
import { S3ObjectStorage } from "~/S3ObjectStorage.js";

/**
 * The S3 backend the shared storage contracts run against, when `WEBINY_TEST_S3_ENDPOINT` points at
 * an S3-compatible server with an existing bucket, e.g. SeaweedFS, with an `s3.json` that gives the
 * key pair below admin rights:
 *
 *   docker run -d -p 8333:8333 -v $PWD/s3.json:/etc/s3.json chrislusf/seaweedfs \
 *     server -ip.bind=0.0.0.0 -s3 -s3.config=/etc/s3.json -dir=/data
 *   (create the bucket `webiny-test` with any S3 client)
 *   WEBINY_TEST_S3_ENDPOINT=http://localhost:8333 WEBINY_TEST_S3_BUCKET=webiny-test \
 *   WEBINY_TEST_S3_ACCESS_KEY_ID=test WEBINY_TEST_S3_SECRET_ACCESS_KEY=test123 yarn test ...
 *
 * Without `WEBINY_TEST_S3_ACCESS_KEY_ID`, the AWS SDK's default credential chain is used (e.g.
 * `AWS_PROFILE`), with `WEBINY_TEST_S3_REGION` for the bucket's region. Every test works under a
 * prefix of its own, removed afterwards.
 */
export const s3Endpoint = process.env.WEBINY_TEST_S3_ENDPOINT;

const readTestCredentials = (): S3StorageConfig.Interface["credentials"] => {
    const accessKeyId = process.env.WEBINY_TEST_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.WEBINY_TEST_S3_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
        return undefined;
    }
    return { accessKeyId, secretAccessKey };
};

let storageConfig: S3StorageConfig.Interface;

export const s3Backend: TestStorageBackend = {
    name: "s3",
    async setup() {
        storageConfig = {
            bucket: process.env.WEBINY_TEST_S3_BUCKET || "webiny-test",
            region: process.env.WEBINY_TEST_S3_REGION || "us-east-1",
            endpoint: s3Endpoint,
            forcePathStyle: true,
            prefix: `test-${randomUUID()}/`,
            credentials: readTestCredentials()
        };
    },
    async cleanup() {
        const storage = new S3ObjectStorage(storageConfig);
        await storage.deletePrefix("tenants/");
        const inAMinute = new Date(Date.now() + 60_000);
        await storage.abortMultipartUploads({ prefix: "tenants/", startedBefore: inAMinute });
    },
    config() {
        // A bucket, not a folder: no storage path.
        return { storagePath: undefined, uploadSecret: SECRET };
    },
    storage() {
        return new S3ObjectStorage(storageConfig);
    }
};
