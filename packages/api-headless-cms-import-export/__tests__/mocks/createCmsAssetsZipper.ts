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
import { CmsAssetsZipper } from "~/tasks/utils/cmsAssetsZipper";
import { Upload } from "~/tasks/utils/upload";
import { Zipper } from "~/tasks/utils/zipper";
import { Archiver } from "~/tasks/utils/archiver";
import { ICmsEntryFetcher } from "~/tasks/utils/cmsEntryFetcher";
import { IEntryAssets, IEntryAssetsList } from "~/tasks/utils/entryAssets";
import { IFileFetcher } from "~/tasks/utils/fileFetcher";
import { createFileFetcher } from "~tests/mocks/createFileFetcher";
import { createEntryAssetsList } from "~tests/mocks/createEntryAssetsList";
import { createUrlSigner } from "~tests/mocks/createUrlSigner";

interface ICreateCmsAssetsZipperParams {
    entryFetcher?: ICmsEntryFetcher;
    createEntryAssets: () => IEntryAssets;
    createEntryAssetsList?: () => IEntryAssetsList;
    fileFetcher?: IFileFetcher;
    region?: string;
    filename?: string;
    stream?: PassThrough;
    bucket?: string;
}

export const createCmsAssetsZipper = (params: ICreateCmsAssetsZipperParams) => {
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

    const urlSigner = createUrlSigner();

    const cmsAssetsZipper = new CmsAssetsZipper({
        fileFetcher: createFileFetcher(),
        entryFetcher: async () => {
            return {
                items: [],
                meta: {
                    totalCount: 0,
                    cursor: null,
                    hasMoreItems: false
                }
            };
        },
        createEntryAssetsList: () => {
            return createEntryAssetsList();
        },
        zipper,
        urlSigner,
        ...params
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
        cmsAssetsZipper
    };
};
