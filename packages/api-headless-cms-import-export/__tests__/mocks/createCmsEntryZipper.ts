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
import { CmsEntryZipper } from "~/tasks/utils/cmsEntryZipper";
import { Upload } from "~/tasks/utils/upload";
import { Zipper } from "~/tasks/utils/zipper";
import { createArchiver } from "~/tasks/utils/archiver";
import type { ICmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher";
import type { IAsset, IEntryAssets } from "~/tasks/utils/entryAssets";
import type { IUniqueResolver } from "~/tasks/utils/uniqueResolver/abstractions/UniqueResolver";
import { WEBINY_EXPORT_ENTRIES_EXTENSION } from "~/tasks/constants";

interface ICreateCmsEntryZipperParams {
    fetcher: ICmsEntryFetcher;
    region?: string;
    filename?: string;
    stream?: PassThrough;
    bucket?: string;
    entryAssets: IEntryAssets;
    uniqueAssetsResolver: IUniqueResolver<IAsset>;
}

export const createCmsEntryZipper = (params: ICreateCmsEntryZipperParams) => {
    const stream = params.stream || createPassThrough();

    const mockedClient = mockClient(S3Client);
    mockedClient.on(CreateMultipartUploadCommand).resolves({ UploadId: "1" });
    mockedClient.on(GetObjectCommand).resolves({});
    mockedClient.on(UploadPartCommand).resolves({ ETag: "1" });

    const region = params.region || "eu-central-1";
    const bucket = params.bucket || "my-test-bucket";
    const filename = params.filename || `test.${WEBINY_EXPORT_ENTRIES_EXTENSION}`;

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

    const archiver = createArchiver({
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
        entryAssets: params.entryAssets,
        uniqueAssetsResolver: params.uniqueAssetsResolver
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
