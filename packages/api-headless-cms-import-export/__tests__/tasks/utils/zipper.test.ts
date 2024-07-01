import { Zipper } from "~/tasks/utils/Zipper";
import { Upload } from "~/tasks/utils/Upload";
import { createPassThrough } from "~tests/mocks/createPassThrough";
import { Archiver } from "~/tasks/utils/Archiver";
import { mockClient } from "aws-sdk-client-mock";
import { Upload as BaseUpload } from "@webiny/aws-sdk/lib-storage";
import {
    CreateMultipartUploadCommand,
    createS3Client,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import AdmZip from "adm-zip";

describe("zipper", () => {
    it("should properly create a Zipper instance", async () => {
        mockClient(S3Client);

        const upload = new Upload({
            client: createS3Client(),
            bucket: "my-test-bucket",
            stream: createPassThrough(),
            filename: "test.zip"
        });

        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        expect(zipper.archiver).not.toBeNull();
    });

    it("should properly zip a file", async () => {
        const stream = createPassThrough();

        const buffers: Buffer[] = [];

        let buffer: Buffer | undefined = undefined;

        stream.on("data", chunk => {
            buffers.push(chunk);
        });

        stream.on("end", () => {
            buffer = Buffer.concat(buffers);
        });

        const client = mockClient(S3Client);
        client.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
        client.on(UploadPartCommand).resolves({ ETag: "1" });

        const upload = new Upload({
            client: createS3Client(),
            bucket: "my-test-bucket",
            stream,
            factory(params) {
                return new BaseUpload(params);
            },
            filename: "test.zip"
        });

        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        const json = JSON.stringify({
            aReallyComplexJson: "yes!",
            nested: {
                a: "b",
                c: "d",
                evenMoreNested: {
                    e: "f",
                    g: "h"
                }
            }
        });

        await zipper.add(Buffer.from(json), {
            name: "test.json"
        });

        await new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
        await zipper.finalize();

        await new Promise(resolve => {
            setTimeout(resolve, 2000);
        });

        await zipper.done();

        expect(buffer).toBeInstanceOf(Buffer);

        const zipped = buffer!.toString("utf-8");

        expect(zipped).toMatch("test.json");

        const zip = new AdmZip(buffer);

        const zipEntries = zip.getEntries();

        expect(zipEntries.length).toEqual(1);

        expect(zipEntries[0].entryName).toEqual("test.json");

        expect(zip.readAsText(zipEntries[0])).toEqual(json);
    });

    it("should abort zipper if no records", async () => {
        expect.assertions(3);
        const stream = createPassThrough();

        const buffers: Buffer[] = [];

        let buffer: Buffer | undefined = undefined;

        stream.on("data", chunk => {
            buffers.push(chunk);
        });

        stream.on("end", () => {
            buffer = Buffer.concat(buffers);
        });

        const client = mockClient(S3Client);
        client.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
        client.on(UploadPartCommand).resolves({ ETag: "1" });

        const upload = new Upload({
            client: createS3Client(),
            bucket: "my-test-bucket",
            stream,
            factory(params) {
                return new BaseUpload(params);
            },
            filename: "test.zip"
        });

        const archiver = new Archiver({
            format: "zip",
            options: {
                gzip: true
            }
        });

        const zipper = new Zipper({
            upload,
            archiver
        });

        setTimeout(() => {
            zipper.abort();
        }, 250);

        try {
            await zipper.done();
        } catch (ex) {
            expect(ex.message).toEqual("Upload aborted.");
        }

        expect(buffer).toBeUndefined();
        expect(buffers).toHaveLength(0);
    });
});
