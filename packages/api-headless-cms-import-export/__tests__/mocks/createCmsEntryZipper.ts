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
    region?: string;
    filename?: string;
    stream?: PassThrough;
    bucket?: string;
}

export const createCmsEntryZipper = (params: ICreateCmsEntryZipperParams) => {
    const stream = params.stream || createPassThrough();

    const client = mockClient(S3Client);
    client.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
    client.on(UploadPartCommand).resolves({ ETag: "1" });

    const region = params.region || "eu-central-1";
    const bucket = params.bucket || "my-test-bucket";
    const filename = params.filename || "test.zip";

    const upload = new Upload({
        client: createS3Client({
            region
        }),
        bucket,
        stream,
        filename
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
        s3Url: `https://${bucket}.s3.${region}.amazonaws.com/${filename}`,
        region,
        bucket,
        filename,
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
