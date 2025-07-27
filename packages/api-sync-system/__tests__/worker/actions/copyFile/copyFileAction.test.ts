import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    createS3Client,
    HeadObjectCommand,
    HeadObjectCommandInput,
    ListPartsCommand,
    S3Client,
    UploadPartCopyCommand
} from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { createCopyFileAction } from "~/worker/actions/copyFile/copyFileAction.js";

describe("copyFileAction", () => {
    beforeEach(() => {
        process.env.DEBUG = "true";
    });

    it("should fail to parse invalid input data", () => {
        console.log = jest.fn();

        const action = createCopyFileAction({
            createS3Client
        });

        const result = action.parse({
            unknownData: true
        });
        expect(result).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith({
            message: "Validation failed.",
            code: "VALIDATION_FAILED_INVALID_FIELDS",
            data: {
                invalidFields: {
                    action: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["action"]
                        },
                        message: "Required"
                    },
                    key: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["key"]
                        },
                        message: "Required"
                    },
                    source: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["source"]
                        },
                        message: "Required"
                    },
                    target: {
                        code: "invalid_type",
                        data: {
                            fatal: undefined,
                            path: ["target"]
                        },
                        message: "Required"
                    }
                }
            },
            stack: expect.any(String)
        });
    });

    it("should parse input data", () => {
        const action = createCopyFileAction({
            createS3Client
        });

        const result = action.parse({
            action: "copyFile",
            key: "test-file.txt",
            source: {
                bucket: "source-bucket",
                region: "us-east-1"
            },
            target: {
                bucket: "target-bucket",
                region: "us-west-2"
            }
        });

        expect(result).toEqual({
            action: "copyFile",
            key: "test-file.txt",
            source: {
                bucket: "source-bucket",
                region: "us-east-1"
            },
            target: {
                bucket: "target-bucket",
                region: "us-west-2"
            }
        });
    });

    it("should copy a file", async () => {
        const mockedS3Client = mockClient(S3Client);
        mockedS3Client
            .on(AbortMultipartUploadCommand)
            .resolves({ $metadata: { httpStatusCode: 204 } });
        mockedS3Client
            .on(CompleteMultipartUploadCommand)
            .resolves({ $metadata: { httpStatusCode: 200 } });
        mockedS3Client.on(CreateMultipartUploadCommand).resolves({
            UploadId: "upload-id",
            $metadata: { httpStatusCode: 200 }
        });
        mockedS3Client.on(HeadObjectCommand).callsFake((input: HeadObjectCommandInput) => {
            if (input.Bucket === "target-bucket") {
                return null;
            }
            return {
                ContentLength: 1000,
                ETag: "something",
                $metadata: { httpStatusCode: 200 }
            };
        });
        mockedS3Client.on(UploadPartCopyCommand).resolves({
            CopyPartResult: {
                ETag: "etag",
                LastModified: new Date()
            },
            $metadata: { httpStatusCode: 200 }
        });
        mockedS3Client.on(ListPartsCommand).resolves({
            Parts: [],
            $metadata: { httpStatusCode: 200 }
        });

        const action = createCopyFileAction({
            createS3Client
        });

        await action.handle({
            data: {
                action: "copyFile",
                key: "test-file.txt",
                source: {
                    bucket: "source-bucket",
                    region: "us-east-1"
                },
                target: {
                    bucket: "target-bucket",
                    region: "us-west-2"
                }
            }
        });
    });
});
