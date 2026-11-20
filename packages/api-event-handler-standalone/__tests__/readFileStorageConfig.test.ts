import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import nodePath from "node:path";
import { readFileStorageConfig } from "~/config/readFileStorageConfig.js";

const read = (env: Record<string, string | undefined>) => {
    const problems: string[] = [];
    const storage = readFileStorageConfig(env, problems);
    return { storage, problems };
};

describe("readFileStorageConfig", () => {
    it("reads a folder on disk, resolved to an absolute path", () => {
        const { storage, problems } = read({ WEBINY_LOCAL_STORAGE_PATH: "data/storage" });

        expect(problems).toEqual([]);
        expect(storage).toEqual({ type: "disk", path: nodePath.resolve("data/storage") });
    });

    it("reads every S3 setting", () => {
        const { storage, problems } = read({
            WEBINY_S3_BUCKET: "uploads",
            WEBINY_S3_REGION: "auto",
            WEBINY_S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
            WEBINY_S3_FORCE_PATH_STYLE: "true",
            WEBINY_S3_PREFIX: "staging",
            WEBINY_S3_ACCESS_KEY_ID: "key-id",
            WEBINY_S3_SECRET_ACCESS_KEY: " secret "
        });

        expect(problems).toEqual([]);
        expect(storage).toEqual({
            type: "s3",
            bucket: "uploads",
            region: "auto",
            endpoint: "https://account.r2.cloudflarestorage.com",
            forcePathStyle: true,
            prefix: "staging/",
            // Secrets are kept exactly as given.
            credentials: { accessKeyId: "key-id", secretAccessKey: " secret " }
        });
    });

    it("needs only a bucket and a region for AWS S3, with credentials from the SDK's chain", () => {
        const { storage, problems } = read({
            WEBINY_S3_BUCKET: "uploads",
            AWS_REGION: "eu-central-1"
        });

        expect(problems).toEqual([]);
        expect(storage).toEqual({
            type: "s3",
            bucket: "uploads",
            region: "eu-central-1",
            endpoint: undefined,
            forcePathStyle: false,
            prefix: "",
            credentials: undefined
        });
    });

    it("refuses both a folder and a bucket", () => {
        const { storage, problems } = read({
            WEBINY_LOCAL_STORAGE_PATH: "data/storage",
            WEBINY_S3_BUCKET: "uploads"
        });

        expect(storage).toBeUndefined();
        expect(problems).toEqual(["Set WEBINY_LOCAL_STORAGE_PATH or WEBINY_S3_BUCKET, not both."]);
    });

    it.each(["https://", "http://:9000", "r2.example.com", "ftp://r2.example.com"])(
        "refuses the endpoint %j",
        endpoint => {
            const { storage, problems } = read({
                WEBINY_S3_BUCKET: "uploads",
                WEBINY_S3_REGION: "auto",
                WEBINY_S3_ENDPOINT: endpoint
            });

            expect(storage).toBeUndefined();
            expect(problems).toEqual([`WEBINY_S3_ENDPOINT is not an http(s) URL: "${endpoint}".`]);
        }
    );

    it("names every problem with the S3 settings", () => {
        const { storage, problems } = read({
            WEBINY_S3_BUCKET: "uploads",
            WEBINY_S3_ENDPOINT: "r2.example.com",
            WEBINY_S3_FORCE_PATH_STYLE: "yes",
            WEBINY_S3_PREFIX: "/staging",
            WEBINY_S3_ACCESS_KEY_ID: "key-id"
        });

        expect(storage).toBeUndefined();
        expect(problems).toEqual([
            'WEBINY_S3_REGION is not set ("auto" for Cloudflare R2).',
            'WEBINY_S3_ENDPOINT is not an http(s) URL: "r2.example.com".',
            'WEBINY_S3_FORCE_PATH_STYLE must be "true" or "false": "yes".',
            'WEBINY_S3_PREFIX must not start with "/": "/staging".',
            "Set both WEBINY_S3_ACCESS_KEY_ID and WEBINY_S3_SECRET_ACCESS_KEY, or neither."
        ]);
    });
});
