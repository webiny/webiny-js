import { UrlSigner } from "~/tasks/utils/urlSigner";
import { GetObjectCommand, ListObjectsCommand, S3Client } from "@webiny/aws-sdk/client-s3";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { mockClient } from "aws-sdk-client-mock";
import { getBucket } from "~/tasks/utils/helpers/getBucket";

jest.setTimeout(5000);

describe("url signer", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "testing-bucket";
    });

    it("should sign the url", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(ListObjectsCommand).resolves({});
        mockedClient.on(GetObjectCommand).resolves({});

        const urlSigner = new UrlSigner({
            bucket: getBucket(),
            client: createS3Client()
        });

        const result = await urlSigner.sign({
            key: "a-key.zip",
            timeout: 1000
        });
        expect(result).toEqual({
            bucket: getBucket(),
            expiresOn: expect.toBeDateString(),
            key: "a-key.zip",
            url: expect.toBeString()
        });
    });
});
