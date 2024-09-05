import { createDownloadFileFromUrl } from "~/tasks/domain/downloadFileFromUrl/index";
import {
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    GetObjectCommand,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { ICmsImportExportValidatedContentEntriesFile } from "~/types";
import { createMockFetch } from "~tests/mocks/fetch";
import fs from "fs";
import path from "path";
import { createMockMultipartUpload } from "~tests/mocks/mockMultipartUpload";

describe("import from url content entries combined", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket";
    });

    it("should construct class properly", async () => {
        const file: Pick<ICmsImportExportValidatedContentEntriesFile, "get" | "size"> = {
            get: "https://webiny.com/asdgkdhsbg3iu2bfd/file-1.we.zip",
            size: 12345
        };

        const { pathname: filename } = new URL(file.get);

        const combined = createDownloadFileFromUrl({
            fetch: createMockFetch(async () => {
                return {
                    stream: new ReadableStream()
                };
            }),
            file: {
                url: file.get,
                size: file.size,
                key: filename
            },
            upload: await createMockMultipartUpload()
        });

        expect(combined.isDone()).toBe(false);
        expect(combined.getNextRange()).toEqual(0);
    });

    it("should start processing and finish properly", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
        mockedClient.on(CompleteMultipartUploadCommand).resolves({});
        mockedClient.on(GetObjectCommand).resolves({});
        mockedClient.on(UploadPartCommand).resolves({ ETag: "1" });

        const filename = "testing.we.zip";
        const file: Pick<ICmsImportExportValidatedContentEntriesFile, "get" | "size"> = {
            get: path.resolve(__dirname, `../../mocks/${filename}`),
            size: 4642
        };

        const combined = createDownloadFileFromUrl({
            fetch: createMockFetch(async url => {
                const file = fs.readFileSync(url);
                return {
                    toArrayBuffer: async () => {
                        return file.buffer;
                    },
                    toJSON: async () => {
                        return file.toJSON();
                    },
                    toText: async () => {
                        return file.toString();
                    },
                    stream: new ReadableStream({
                        pull: controller => {
                            controller.enqueue(file);
                            controller.close();
                        }
                    })
                };
            }),
            file: {
                url: file.get,
                size: file.size,
                key: filename
            },
            upload: await createMockMultipartUpload()
        });

        const result = await combined.process(async () => {
            return;
        });

        expect(result).toEqual("done");

        expect(combined.isDone()).toBe(true);
        expect(combined.getNextRange()).toEqual(1);
    });
});
