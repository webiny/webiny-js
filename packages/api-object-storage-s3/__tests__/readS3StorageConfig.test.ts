import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { readS3StorageConfig } from "~/readS3StorageConfig.js";

const problemsMessage = (problems: string[]) => {
    return ["The S3 object storage is misconfigured:", ...problems].join("\n  ");
};

describe("readS3StorageConfig", () => {
    it("reads every S3 setting", () => {
        const config = readS3StorageConfig({
            WEBINY_S3_BUCKET: "uploads",
            WEBINY_S3_REGION: "auto",
            WEBINY_S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
            WEBINY_S3_FORCE_PATH_STYLE: "true",
            WEBINY_S3_PREFIX: "staging",
            WEBINY_S3_ACCESS_KEY_ID: "key-id",
            WEBINY_S3_SECRET_ACCESS_KEY: " secret "
        });

        expect(config).toEqual({
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
        const config = readS3StorageConfig({
            WEBINY_S3_BUCKET: "uploads",
            AWS_REGION: "eu-central-1"
        });

        expect(config).toEqual({
            bucket: "uploads",
            region: "eu-central-1",
            endpoint: undefined,
            forcePathStyle: false,
            prefix: "",
            credentials: undefined
        });
    });

    it("ends the prefix in exactly one /", () => {
        const config = readS3StorageConfig({
            WEBINY_S3_BUCKET: "uploads",
            WEBINY_S3_REGION: "auto",
            WEBINY_S3_PREFIX: "staging///"
        });

        expect(config.prefix).toBe("staging/");
    });

    it("reads a prefix with a long run of / in linear time", () => {
        const prefix = `a${"/".repeat(100_000)}a`;

        const start = performance.now();
        const config = readS3StorageConfig({
            WEBINY_S3_BUCKET: "uploads",
            WEBINY_S3_REGION: "auto",
            WEBINY_S3_PREFIX: prefix
        });
        const elapsedMs = performance.now() - start;

        expect(config.prefix).toBe(`${prefix}/`);
        expect(elapsedMs).toBeLessThan(100);
    });

    it.each(["https://", "http://:9000", "r2.example.com", "ftp://r2.example.com"])(
        "refuses the endpoint %j",
        endpoint => {
            const read = () => {
                return readS3StorageConfig({
                    WEBINY_S3_BUCKET: "uploads",
                    WEBINY_S3_REGION: "auto",
                    WEBINY_S3_ENDPOINT: endpoint
                });
            };

            expect(read).toThrowError(
                problemsMessage([`WEBINY_S3_ENDPOINT is not an http(s) URL: "${endpoint}".`])
            );
        }
    );

    it("names every problem in one error", () => {
        const read = () => {
            return readS3StorageConfig({
                WEBINY_S3_ENDPOINT: "r2.example.com",
                WEBINY_S3_FORCE_PATH_STYLE: "yes",
                WEBINY_S3_PREFIX: "/staging",
                WEBINY_S3_ACCESS_KEY_ID: "key-id"
            });
        };

        expect(read).toThrowError(
            problemsMessage([
                "WEBINY_S3_BUCKET is not set.",
                'WEBINY_S3_REGION is not set ("auto" for Cloudflare R2).',
                'WEBINY_S3_ENDPOINT is not an http(s) URL: "r2.example.com".',
                'WEBINY_S3_FORCE_PATH_STYLE must be "true" or "false": "yes".',
                'WEBINY_S3_PREFIX must not start with "/": "/staging".',
                "Set both WEBINY_S3_ACCESS_KEY_ID and WEBINY_S3_SECRET_ACCESS_KEY, or neither."
            ])
        );
    });
});
