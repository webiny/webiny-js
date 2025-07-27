import {
    createS3Client,
    DeleteObjectCommand,
    DeleteObjectCommandInput,
    HeadObjectCommand,
    S3Client
} from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { createDeleteFileAction } from "~/worker/actions/deleteFile/deleteFileAction.js";

describe("deleteFileAction", () => {
    beforeEach(() => {
        process.env.DEBUG = "true";
    });

    it("should fail to parse invalid input data", () => {
        console.log = jest.fn();
        const action = createDeleteFileAction({
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

    it("should successfully parse valid input data", () => {
        const action = createDeleteFileAction({
            createS3Client
        });

        const result = action.parse({
            action: "deleteFile",
            key: "file-key",
            source: {
                bucket: "source-bucket",
                region: "us-east-1"
            },
            target: {
                bucket: "target-bucket",
                region: "us-east-1"
            }
        });

        expect(result).toEqual({
            action: "deleteFile",
            key: "file-key",
            source: {
                bucket: "source-bucket",
                region: "us-east-1"
            },
            target: {
                bucket: "target-bucket",
                region: "us-east-1"
            }
        });
    });

    it("should handle file deletion", async () => {
        const send = jest.fn();
        const mockedS3Client = mockClient(S3Client);
        mockedS3Client.on(DeleteObjectCommand).callsFake((input: DeleteObjectCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });
        mockedS3Client.on(HeadObjectCommand).resolves({
            $metadata: {
                httpStatusCode: 200
            }
        });

        const action = createDeleteFileAction({
            createS3Client
        });

        const result = await action.handle({
            data: {
                action: "deleteFile",
                key: "file-key",
                target: {
                    bucket: "target-bucket",
                    region: "us-east-1"
                }
            }
        });

        expect(result).toBeUndefined();

        expect(send).toHaveBeenCalledWith({
            Bucket: "target-bucket",
            Key: "file-key"
        });
    });

    it("should not run delete if file does not exist", async () => {
        const send = jest.fn();
        const mockedS3Client = mockClient(S3Client);
        mockedS3Client.on(DeleteObjectCommand).callsFake((input: DeleteObjectCommandInput) => {
            send(input);
            return {
                $metadata: {
                    httpStatusCode: 200
                }
            };
        });
        mockedS3Client.on(HeadObjectCommand).resolves({
            $metadata: {
                httpStatusCode: 404
            }
        });

        const action = createDeleteFileAction({
            createS3Client
        });

        const result = await action.handle({
            data: {
                action: "deleteFile",
                key: "file-key",
                target: {
                    bucket: "target-bucket",
                    region: "us-east-1"
                }
            }
        });

        expect(result).toBeUndefined();

        expect(send).not.toHaveBeenCalled();
    });
});
