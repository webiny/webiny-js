import type { HeadObjectCommandInput } from "@webiny/aws-sdk/client-s3/index.js";
import {
    CreateMultipartUploadCommand,
    createS3Client,
    HeadObjectCommand,
    S3Client
} from "@webiny/aws-sdk/client-s3/index.js";
import { mockClient } from "aws-sdk-client-mock";
import { CopyFile } from "~/worker/actions/copyFile/CopyFile.js";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import { describe, expect, it, vi } from "vitest";

describe("CopyFile", () => {
    const targetDeployment = createMockTargetDeployment();
    const targetRegion = targetDeployment.region;
    const targetBucket = targetDeployment.services.s3Id;
    const sourceDeployment = createMockSourceDeployment();
    const sourceRegion = sourceDeployment.region;
    const sourceBucket = sourceDeployment.services.s3Id;

    it("should throw an error if minPartSize cannot be parsed", async () => {
        try {
            const copyFile = new CopyFile({
                targetRegion,
                createS3Client,
                sourceRegion,
                // @ts-expect-error
                minPartSize: {}
            });
            expect(copyFile).toEqual("SHOULD NOT REACH");
        } catch (ex) {
            expect(ex.message).toBe(`Invalid byte size value type "object".`);
        }
    });

    it("should throw an error if minPartSize is less than 5MB", async () => {
        try {
            const copyFile = new CopyFile({
                targetRegion,
                createS3Client: createS3Client,
                sourceRegion,
                minPartSize: "4.99MB"
            });
            expect(copyFile).toEqual("SHOULD NOT REACH");
        } catch (ex) {
            expect(ex.message).toBe("minPartSize must be at least 5MB.");
        }
    });

    it("should set minPartSizeBytes to 5.5MB", async () => {
        const copyFileString = new CopyFile({
            targetRegion,
            createS3Client: createS3Client,
            sourceRegion,
            minPartSize: "5.5MB"
        });
        // @ts-expect-error
        expect(copyFileString.minPartSizeBytes).toBe(5.5 * 1024 * 1024);

        const copyFileNumber = new CopyFile({
            targetRegion,
            createS3Client,
            sourceRegion,
            minPartSize: 5.5 * 1024 * 1024
        });
        // @ts-expect-error
        expect(copyFileNumber.minPartSizeBytes).toBe(5.5 * 1024 * 1024);
    });

    it("should throw error on missing source", async () => {
        const clientMock = mockClient(S3Client);
        clientMock.on(HeadObjectCommand).resolves({});

        const copyFile = new CopyFile({
            targetRegion,
            createS3Client,
            sourceRegion
        });

        try {
            const result = await copyFile.copy({
                sourceBucket,
                key: "key",
                targetBucket
            });
            expect(result).toEqual("SHOULD NOT REACH");
        } catch (ex) {
            expect(ex.message).toBe("Source object metadata is invalid or missing.");
        }
    });

    it("should break if target exists", async () => {
        const send = vi.fn();
        const clientMock = mockClient(S3Client);
        clientMock.on(HeadObjectCommand).callsFake((input: HeadObjectCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                },
                ETag: "someEtag",
                ContentLength: 1000
            };
        });

        const copyFile = new CopyFile({
            targetRegion,
            createS3Client,
            sourceRegion
        });

        const result = await copyFile.copy({
            sourceBucket,
            key: "key",
            targetBucket
        });
        expect(result).toBeUndefined();
        expect(send).toHaveBeenCalledTimes(2);
        expect(send).toHaveBeenNthCalledWith(1, {
            Bucket: "sourceS3Id",
            Key: "key"
        });
        expect(send).toHaveBeenNthCalledWith(2, {
            Bucket: "targetS3Id",
            Key: "key"
        });
    });

    it("should throw an error on CreateMultipartUploadCommand", async () => {
        const clientMock = mockClient(S3Client);
        clientMock.on(CreateMultipartUploadCommand).resolves({});
        clientMock.on(HeadObjectCommand).callsFake((input: HeadObjectCommandInput) => {
            if (input.Bucket === targetBucket) {
                return {
                    $metadata: {
                        httpStatusCode: 404
                    }
                };
            }
            return {
                $metadata: {
                    httpStatusCode: 200
                },
                ETag: "someEtag",
                ContentLength: 1000
            };
        });

        const copyFile = new CopyFile({
            targetRegion,
            createS3Client,
            sourceRegion
        });

        try {
            const result = await copyFile.copy({
                sourceBucket,
                key: "key",
                targetBucket
            });
            expect(result).toBe("SHOULD NOT REACH");
        } catch (ex) {
            expect(ex.message).toBe("Failed to create multipart upload.");
        }
    });
});
