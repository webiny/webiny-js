import { Archiver, CmsEntryZipper, ICmsEntryFetcher, Upload, Zipper } from "~/tasks/utils";
import {
    CreateMultipartUploadCommand,
    createS3Client,
    GetObjectCommand,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { createPassThrough } from "~tests/mocks/createPassThrough";
import { PassThrough } from "stream";
import { mockClient } from "aws-sdk-client-mock";
import { IEntryAssets } from "~/tasks/utils/abstractions/EntryAssets";
import { IEntryAssetsList } from "~/tasks/utils/abstractions/EntryAssetsList";
import { SignUrl } from "~/tasks/utils/SignUrl";

interface ICreateCmsEntryZipperParams {
    fetcher: ICmsEntryFetcher;
    entryAssets: IEntryAssets;
    entryAssetsList: IEntryAssetsList;
    region?: string;
    filename?: string;
    stream?: PassThrough;
    bucket?: string;
}

export const createCmsEntryZipper = (params: ICreateCmsEntryZipperParams) => {
    const stream = params.stream || createPassThrough();

    const mockedClient = mockClient(S3Client);
    mockedClient.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
    mockedClient.on(GetObjectCommand).resolves({});
    mockedClient.on(UploadPartCommand).resolves({ ETag: "1" });

    const region = params.region || "eu-central-1";
    const bucket = params.bucket || "my-test-bucket";
    const filename = params.filename || "test.zip";

    const client = createS3Client({
        region
    });

    const upload = new Upload({
        client,
        bucket,
        stream,
        filename
    });

    let buffers: Buffer[] | undefined = undefined;

    stream.on("data", chunk => {
        if (!buffers) {
            buffers = [];
        }
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

    const signUrl = new SignUrl({
        client,
        bucket
    });

    const cmsEntryZipper = new CmsEntryZipper({
        zipper,
        signUrl,
        fetcher: params.fetcher,
        entryAssets: params.entryAssets,
        entryAssetsList: params.entryAssetsList
    });

    return {
        s3Url: `https://${bucket}.s3.${region}.amazonaws.com/${filename}`,
        region,
        bucket,
        filename,
        getBuffer: () => {
            if (!buffers) {
                throw new Error("No buffers found. Please write some data to the stream first.");
            }
            return Buffer.concat(buffers);
        },
        upload,
        archiver,
        zipper,
        cmsEntryZipper
    };
};
