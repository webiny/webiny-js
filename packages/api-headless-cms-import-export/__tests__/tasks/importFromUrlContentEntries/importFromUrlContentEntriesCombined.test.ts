import { PassThrough } from "stream";
import { createDownloadFileFromUrl } from "~/tasks/domain/downloadFileFromUrl/index";
import { Upload } from "~/tasks/utils/upload";
import {
    CompleteMultipartUploadCommand,
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
import { createUpload } from "~tests/mocks/createUpload";

describe("import from url content entries combined", () => {
    beforeEach(async () => {
        process.env.S3_BUCKET = "a-mock-s3-bucket";
    });

    it("should construct class properly", async () => {
        const stream = new PassThrough({
            autoDestroy: true
        });

        const file: Pick<ICmsImportExportValidatedCombinedContentFile, "get" | "size"> = {
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
        expect(combined.getNext()).toEqual(0);
    });

    it("should start processing and finish properly", async () => {
        const mockedClient = mockClient(S3Client);
        mockedClient.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
        mockedClient.on(CompleteMultipartUploadCommand).resolves({});
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
            file,
            createUpload: () => {
                return createUpload({
                    filename,
                    stream
                });
            }
        });

        const result = await combined.process(async () => {
            return;
        });

        expect(result).toEqual("done");

        expect(combined.isDone()).toBe(true);
        expect(combined.getNext()).toEqual(1);
    });
});
