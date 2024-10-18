import {
    createMultipartUpload,
    IMultipartUploadHandler,
    MultipartUploadHandler
} from "~/tasks/utils/upload";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import {
    AbortMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

/**
 * Private property, should not be able to change.
 * But we need to test the write method.
 */
const mockMinBufferSize = (upload: IMultipartUploadHandler, size: number) => {
    // @ts-expect-error
    upload.minBufferSize = size;
};

describe("multipart upload", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket";
    });

    it("should properly construct multipart upload", async () => {
        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            minBufferSize: "6MB",
            parts: undefined
        });

        expect(upload).toBeInstanceOf(MultipartUploadHandler);
        // @ts-expect-error
        expect(upload.minBufferSize).toEqual(6 * 1024 * 1024);
    });

    it("should properly add a new buffer to the upload but not write", async () => {
        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });

        const json = JSON.stringify({
            test: "test"
        });

        const result = await upload.add(Buffer.from(json));

        expect(result.parts.length).toEqual(0);
        expect(result.pause).toBeFunction();
        expect(result.canBePaused).toBeFunction();

        expect(result.canBePaused()).toBeFalse();
        /**
         * There must be something in the buffer.
         */
        expect(upload.getBuffer()).toEqual({
            buffer: expect.toBeArrayOfSize(1),
            bufferLength: json.length
        });
    });

    it("should fail to write because of no etag", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(UploadPartCommand).resolves({
            ETag: ""
        });

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });

        mockMinBufferSize(upload, 10);

        const json = JSON.stringify({
            test: "test"
        });

        try {
            await upload.add(Buffer.from(json));
        } catch (ex) {
            expect(ex.message).toEqual(`Failed to upload part: 1`);
        }
    });

    it("should properly add a new buffer to the upload and write - should be pausable", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(UploadPartCommand).resolves({
            ETag: "aTestingETag"
        });

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });
        mockMinBufferSize(upload, 10);

        const json = JSON.stringify({
            test: "test"
        });

        const result = await upload.add(Buffer.from(json));

        expect(result.parts.length).toEqual(1);
        expect(result.canBePaused()).toBeTrue();

        const paused = await result.pause();

        expect(paused).toEqual({
            parts: [
                {
                    partNumber: 1,
                    tag: "aTestingETag"
                }
            ],
            uploadId: "testingUploadId"
        });
    });

    it("should fail to complete the upload because of no parts uploaded", async () => {
        expect.assertions(1);

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });

        try {
            await upload.complete();
        } catch (ex) {
            expect(ex.message).toEqual("Failed to complete the upload, no parts were uploaded.");
        }
    });

    it("should successfully complete the upload", async () => {
        expect.assertions(1);

        const mockedClient = mockClient(S3Client);
        mockedClient.on(CompleteMultipartUploadCommand).resolves({
            $metadata: {},
            ETag: "aTestingETag-complete"
        });
        mockedClient.on(UploadPartCommand).resolves({
            ETag: "aTestingETag-part"
        });

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });

        mockMinBufferSize(upload, 10);

        const json = JSON.stringify({ testing: "testing" });
        await upload.add(Buffer.from(json));

        const result = await upload.complete();

        expect(result).toEqual({
            result: {
                $metadata: {},
                ETag: "aTestingETag-complete"
            },
            parts: [
                {
                    partNumber: 1,
                    tag: "aTestingETag-part"
                }
            ],
            uploadId: "testingUploadId"
        });
    });

    it("should fail to pause the upload because of no parts uploaded", async () => {
        expect.assertions(1);

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });

        try {
            const result = await upload.add(Buffer.from("test"));
            await result.pause();
        } catch (ex) {
            expect(ex.message).toEqual("Failed to pause the upload, buffer was not empty.");
        }
    });

    it("should fail to pause the upload because of no tags", async () => {
        expect.assertions(1);

        const mockedClient = mockClient(S3Client);
        mockedClient.on(UploadPartCommand).resolves({
            ETag: "aTestingETag-part"
        });

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            minBufferSize: 10,
            parts: undefined
        });

        mockMinBufferSize(upload, 10);

        try {
            const result = await upload.add(Buffer.from(JSON.stringify({ testing: "testing" })));
            // @ts-expect-error
            upload.parts = [];
            await result.pause();
        } catch (ex) {
            expect(ex.message).toEqual("Failed to pause the upload, no parts were uploaded.");
        }
    });

    it("should successfully pause the upload", async () => {
        expect.assertions(2);

        const mockedClient = mockClient(S3Client);
        mockedClient.on(UploadPartCommand).resolves({
            ETag: "aTestingETag-pause"
        });

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });
        mockMinBufferSize(upload, 10);

        const json = JSON.stringify({
            test: "test"
        });

        const uploaded = await upload.add(Buffer.from(json));
        expect(uploaded.canBePaused()).toBeTrue();

        const result = await uploaded.pause();

        expect(result).toEqual({
            parts: [
                {
                    partNumber: 1,
                    tag: "aTestingETag-pause"
                }
            ],
            uploadId: "testingUploadId"
        });
    });

    it("should abort the upload", async () => {
        expect.assertions(1);
        const mockedClient = mockClient(S3Client);
        mockedClient.on(AbortMultipartUploadCommand).resolves({
            $metadata: {}
        });

        const upload = createMultipartUpload({
            uploadId: "testingUploadId",
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            parts: undefined
        });

        const result = await upload.abort();

        expect(result).toEqual({
            result: {
                $metadata: {}
            },
            parts: [],
            uploadId: "testingUploadId"
        });
    });
});
