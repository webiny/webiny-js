import { Zipper } from "~/tasks/utils/zipper";
import { Upload } from "~/tasks/utils/upload";
import { createPassThrough } from "~tests/mocks/createPassThrough";
import {
    CreateMultipartUploadCommand,
    createS3Client,
    GetObjectCommand,
    S3Client,
    UploadPartCommand
} from "@webiny/aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import type { PassThrough } from "stream";
import { createArchiver } from "~/tasks/utils/archiver";
import { WEBINY_EXPORT_ENTRIES_EXTENSION } from "~/tasks/constants";

interface ICreateZipperParams {
    region?: string;
    filename?: string;
    stream?: PassThrough;
    bucket?: string;
}

export const createZipper = (params: ICreateZipperParams = {}) => {
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

    const archiver = createArchiver({
        format: "zip",
        options: {
            gzip: true
        }
    });

    return new Zipper({
        upload,
        archiver
    });
};
