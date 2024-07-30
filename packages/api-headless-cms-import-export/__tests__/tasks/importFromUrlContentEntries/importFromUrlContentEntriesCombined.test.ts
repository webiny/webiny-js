import { PassThrough } from "stream";
import { ImportFromUrlContentEntriesCombined } from "~/tasks/domain/importFromUrlContentEntries/ImportFromUrlContentEntriesCombined";
import { Upload } from "~/tasks/utils/upload";
import {
    CreateMultipartUploadCommand,
    GetObjectCommand,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { ICmsImportExportValidatedCombinedContentFile } from "~/types";
import { createMockFetch } from "~tests/mocks/fetch";
import fs from "fs";
import path from "path";

jest.setTimeout(5000);

describe("import from url content entries combined", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket";
    });

    it.skip("should construct class properly", async () => {
        const stream = new PassThrough({
            autoDestroy: true
        });

        const file: Pick<ICmsImportExportValidatedCombinedContentFile, "get" | "size"> = {
            get: "https://webiny.com/asdgkdhsbg3iu2bfd/file-1.we.zip",
            size: 12345
        };

        const { pathname: filename } = new URL(file.get);

        const combined = new ImportFromUrlContentEntriesCombined({
            fetch: createMockFetch(async () => {
                return {
                    stream: new ReadableStream()
                };
            }),
            file,
            createUpload: () => {
                return new Upload({
                    client: createS3Client(),
                    bucket: getBucket(),
                    filename,
                    stream
                });
            }
        });

        expect(combined.isDone()).toBe(false);
        expect(combined.getValues()).toEqual({
            start: -1,
            end: -1,
            length: -1,
            done: false
        });
    });

    it("should start processing but fail", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
        mockedClient.on(GetObjectCommand).resolves({});
        mockedClient.on(UploadPartCommand).resolves({ ETag: "1" });

        const stream = new PassThrough({
            autoDestroy: true
        });

        const filename = "testing.we.zip";
        const file: Pick<ICmsImportExportValidatedCombinedContentFile, "get" | "size"> = {
            get: path.resolve(__dirname, `../../mocks/${filename}`),
            size: 4642
        };

        const combined = new ImportFromUrlContentEntriesCombined({
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
            file,
            createUpload: () => {
                return new Upload({
                    client: createS3Client(),
                    bucket: getBucket(),
                    filename,
                    stream
                });
            }
        });

        while (!combined.isDone()) {
            await combined.process();
        }

        expect(combined.isDone()).toBe(true);
        expect(combined.getValues()).toEqual({
            start: -1,
            end: -1,
            length: -1,
            done: true
        });
    });
});
