import { FileFetcher } from "~/tasks/utils/fileFetcher";
import { GetObjectCommand, ListObjectsCommand, S3Client } from "@webiny/aws-sdk/client-s3";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { mockClient } from "aws-sdk-client-mock";
import { basename } from "path";

const fileTxt = {
    Key: "prefix-key/file.txt",
    Size: 100
};
const fileZip = {
    Key: "prefix-key/file.zip",
    Size: 200
};
const fileTar = {
    Key: "prefix-key/file.tar",
    Size: 300
};
const fileNoKey = {
    Key: "",
    Size: 400
};
const files = [fileTxt, fileZip, fileTar, fileNoKey].sort((a, b) => {
    return a.Key.localeCompare(b.Key);
});

describe("file fetcher", () => {
    it("should not fetch any files - empty response", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(ListObjectsCommand).resolves({});
        mockedClient.on(GetObjectCommand).resolves({});

        const fileFetcher = new FileFetcher({
            client: createS3Client(),
            bucket: "a-bucket"
        });

        const result = await fileFetcher.list("prefix-key/");

        expect(result).toEqual([]);

        const file = await fileFetcher.stream("prefix-key/file.txt");
        expect(file).toBeNull();
    });

    it("should list files", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(ListObjectsCommand).resolves({
            Contents: files
        });
        mockedClient.on(GetObjectCommand).resolves({
            Body: "mock" as any
        });

        const fileFetcher = new FileFetcher({
            client: createS3Client(),
            bucket: "a-bucket"
        });

        const result = await fileFetcher.list("prefix-key/");

        expect(result).toEqual(
            files
                .filter(file => !!file.Key)
                .map(file => {
                    return {
                        name: basename(file.Key),
                        key: file.Key,
                        size: file.Size
                    };
                })
        );

        const file = await fileFetcher.stream("prefix-key/file.txt");
        expect(file).not.toBeNull();
        expect(file).toEqual("mock");
    });

    it("should return empty results due to errors while fetching files", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(ListObjectsCommand).rejects(new Error("ListObjectsCommand error"));
        mockedClient.on(GetObjectCommand).rejects(new Error("GetObjectCommand error"));

        const fileFetcher = new FileFetcher({
            client: createS3Client(),
            bucket: "a-bucket"
        });

        const result = await fileFetcher.list("prefix-key/");
        expect(result).toEqual([]);

        const file = await fileFetcher.stream("prefix-key/file.txt");
        expect(file).toBeNull();
    });
});
