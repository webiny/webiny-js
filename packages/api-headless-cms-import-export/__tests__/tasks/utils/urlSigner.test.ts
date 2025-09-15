import { beforeEach, describe, expect, it } from "vitest";
import { UrlSigner } from "~/tasks/utils/urlSigner";
import {
    GetObjectCommand,
    HeadObjectCommand,
    ListObjectsCommand,
    S3Client
} from "@webiny/aws-sdk/client-s3";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { mockClient } from "aws-sdk-client-mock";
import { getBucket } from "~/tasks/utils/helpers/getBucket";

describe("url signer", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "testing-bucket";
    });

    it("should sign the url with head command", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(ListObjectsCommand).resolves({});
        mockedClient.on(HeadObjectCommand).resolves({});

        const urlSigner = new UrlSigner({
            bucket: getBucket(),
            client: createS3Client()
        });

        const result = await urlSigner.head({
            key: "a-key.zip",
            timeout: 1000
        });
        expect(result).toEqual({
            bucket: getBucket(),
            expiresOn: expect.toBeDate(),
            key: "a-key.zip",
            url: expect.any(String)
        });
    });

    it("should sign the url with get command", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(ListObjectsCommand).resolves({});
        mockedClient.on(GetObjectCommand).resolves({});

        const urlSigner = new UrlSigner({
            bucket: getBucket(),
            client: createS3Client()
        });

        const result = await urlSigner.get({
            key: "a-key.zip",
            timeout: 1000
        });
        expect(result).toEqual({
            bucket: getBucket(),
            expiresOn: expect.toBeDate(),
            key: "a-key.zip",
            url: expect.any(String)
        });

        expect(result.url).toContain("x-id=GetObject");
    });
});
