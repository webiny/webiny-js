import { MultipartUploadHandler, MultipartUploadFactory } from "~/tasks/utils/upload";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { CreateMultipartUploadCommand, S3Client } from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";

describe("multipart upload factory", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket";
    });

    it("should properly construct multipart upload factory", async () => {
        const factory = new MultipartUploadFactory({
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            createHandler: params => {
                return new MultipartUploadHandler(params);
            }
        });

        expect(factory).toBeInstanceOf(MultipartUploadFactory);
    });

    it("should properly start a new multipart upload", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(CreateMultipartUploadCommand).resolves({
            UploadId: "testingUploadId"
        });

        const factory = new MultipartUploadFactory({
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            createHandler: params => {
                return new MultipartUploadHandler(params);
            }
        });

        const handler = await factory.start();

        expect(handler).toBeInstanceOf(MultipartUploadHandler);
    });

    it("should fail to start a new multipart upload", async () => {
        expect.assertions(1);
        const mockedClient = mockClient(S3Client);
        mockedClient.on(CreateMultipartUploadCommand).resolves({
            UploadId: ""
        });

        const factory = new MultipartUploadFactory({
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            createHandler: params => {
                return new MultipartUploadHandler(params);
            }
        });

        try {
            await factory.start();
        } catch (ex) {
            expect(ex.message).toBe("Could not initiate multipart upload.");
        }
    });

    it("should properly continue a multipart upload", async () => {
        const factory = new MultipartUploadFactory({
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            createHandler: params => {
                return new MultipartUploadHandler(params);
            }
        });

        const handler = await factory.continue({
            uploadId: "testingUploadId",
            part: 2,
            tags: ["abc", "def"]
        });

        expect(handler).toBeInstanceOf(MultipartUploadHandler);
    });

    it("should fail to continue a multipart upload - missing uploadId", async () => {
        expect.assertions(1);

        const factory = new MultipartUploadFactory({
            client: createS3Client(),
            bucket: getBucket(),
            filename: "test.txt",
            createHandler: params => {
                return new MultipartUploadHandler(params);
            }
        });

        try {
            await factory.continue({
                uploadId: "",
                part: 2,
                tags: ["abc", "def"]
            });
        } catch (ex) {
            expect(ex.message).toBe(`Missing "uploadId" in the multipart upload handler.`);
        }
    });

    it("should fail to continue a multipart upload - missing filename", async () => {
        expect.assertions(1);

        const factory = new MultipartUploadFactory({
            client: createS3Client(),
            bucket: getBucket(),
            filename: "",
            createHandler: params => {
                return new MultipartUploadHandler(params);
            }
        });

        try {
            await factory.continue({
                uploadId: "aTestingUploadId",
                part: 2,
                tags: ["abc", "def"]
            });
        } catch (ex) {
            expect(ex.message).toBe(`Missing "filename" in the multipart upload handler.`);
        }
    });
});
