import { Upload } from "~/tasks/utils/Upload";
import { createPassThrough } from "~tests/mocks/createPassThrough";
import { GenericRecord } from "@webiny/api/types";
import { mockClient } from "aws-sdk-client-mock";
import { createS3Client, S3Client } from "@webiny/aws-sdk/client-s3";
import { PassThrough } from "stream";

jest.mock("@webiny/aws-sdk/lib-storage", () => {
    return {
        Upload: jest.fn((config: GenericRecord) => {
            return {
                config,
                done: jest.fn()
            };
        })
    };
});

describe("upload", () => {
    it("should properly create an instance of Upload", async () => {
        mockClient(S3Client);

        const upload = new Upload({
            client: createS3Client(),
            bucket: "my-test-bucket",
            stream: createPassThrough(),
            filename: "test.zip"
        });

        expect(upload.stream).toBeInstanceOf(PassThrough);
    });
});
