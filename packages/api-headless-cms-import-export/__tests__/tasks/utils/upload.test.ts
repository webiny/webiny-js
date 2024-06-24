import { createPassThrough } from "~tests/mocks/createPassThrough";
import { mockClient } from "aws-sdk-client-mock";
import {
    CreateMultipartUploadCommand,
    createS3Client,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { PassThrough } from "stream";
import { Upload } from "~/tasks/utils";

describe("upload", () => {
    it("should properly create an instance of Upload", async () => {
        const client = mockClient(S3Client);
        client.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
        client.on(UploadPartCommand).resolves({ ETag: "1" });

        const stream = createPassThrough();

        const upload = new Upload({
            client: createS3Client(),
            bucket: "my-test-bucket",
            stream,
            filename: "test.zip"
        });

        expect(upload.stream).toBeInstanceOf(PassThrough);
    });

    it("should abort upload", async () => {
        const client = mockClient(S3Client);
        client.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
        client.on(UploadPartCommand).resolves({ ETag: "1" });

        const stream = createPassThrough();

        const buffers: Buffer[] = [];

        let buffer: Buffer | undefined = undefined;

        stream.on("data", chunk => {
            buffers.push(chunk);
        });

        stream.on("end", () => {
            buffer = Buffer.concat(buffers);
        });

        const upload = new Upload({
            client: createS3Client(),
            bucket: "my-test-bucket",
            stream,
            filename: "test.zip"
        });

        expect(upload.stream).toBeInstanceOf(PassThrough);

        await upload.abort();
        expect(buffer).toBeUndefined();
        expect(buffers).toHaveLength(0);
    });
});
