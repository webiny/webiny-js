import { Upload } from "~/tasks/utils/Upload";
import { createPassThrough } from "~tests/mocks/createPassThrough";
import { mockClient } from "aws-sdk-client-mock";
import { createS3Client, S3Client } from "@webiny/aws-sdk/client-s3";
import { PassThrough } from "stream";

describe("upload", () => {
    it("should properly create an instance of Upload", async () => {
        mockClient(S3Client);

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
        mockClient(S3Client);

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
