import { Archiver, CmsEntryZipper, ICmsEntryFetcher, Upload, Zipper } from "~/tasks/utils";
import {
    CreateMultipartUploadCommand,
    createS3Client,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { createPassThrough } from "~tests/mocks/createPassThrough";
import { PassThrough } from "stream";
import { mockClient } from "aws-sdk-client-mock";

interface ICreateCmsEntryZipperParams {
    fetcher: ICmsEntryFetcher;
    filename?: string;
    stream?: PassThrough;
    bucket?: string;
}

export const createCmsEntryZipper = (params: ICreateCmsEntryZipperParams) => {
    const stream = params.stream || createPassThrough();

    const client = mockClient(S3Client);
    client.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
    client.on(UploadPartCommand).resolves({ ETag: "1" });

    const upload = new Upload({
        client: createS3Client(),
        bucket: params.bucket || "my-test-bucket",
        stream,
        filename: params.filename || "test.zip"
    });

    const buffers: Buffer[] = [];

    stream.on("data", chunk => {
        buffers.push(chunk);
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

    const cmsEntryZipper = new CmsEntryZipper({
        zipper,
        fetcher: params.fetcher,
        archiver
    });

    return {
        buffers,
        getBuffer: () => {
            return Buffer.concat(buffers);
        },
        upload,
        archiver,
        zipper,
        cmsEntryZipper
    };
};
