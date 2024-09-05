import { createPassThrough } from "~tests/mocks/createPassThrough";
import { mockClient } from "aws-sdk-client-mock";
import {
    CreateMultipartUploadCommand,
    createS3Client,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { PassThrough } from "stream";
import { Upload } from "~/tasks/utils/upload";
import { WEBINY_EXPORT_ENTRIES_EXTENSION } from "~/tasks/constants";

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
            filename: `test.${WEBINY_EXPORT_ENTRIES_EXTENSION}`
        });

        expect(upload.stream).toBeInstanceOf(PassThrough);
    });

    it("should abort upload", async () => {
        expect.assertions(4);

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
            filename: `test.${WEBINY_EXPORT_ENTRIES_EXTENSION}`
        });

        expect(upload.stream).toBeInstanceOf(PassThrough);

        setTimeout(() => {
            upload.abort();
        }, 250);
        try {
            await upload.done();
        } catch (ex) {
            expect(ex.message).toEqual("Upload aborted.");
        }

        expect(buffer).toBeUndefined();
        expect(buffers).toHaveLength(0);
    });
});
