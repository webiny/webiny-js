import type { Context } from "~/types.js";
import { createS3Client } from "~/tasks/utils/helpers/s3Client.js";
import { ImportFromUrlProcessAssets } from "./importFromUrlProcessAssets/ImportFromUrlProcessAssets.js";
import type {
    IImportFromUrlProcessAssets,
    IImportFromUrlProcessAssetsInput,
    IImportFromUrlProcessAssetsOutput
} from "./importFromUrlProcessAssets/abstractions/ImportFromUrlProcessAssets.js";
import { getBucket } from "~/tasks/utils/helpers/getBucket.js";
import {
    createCompressedFileReader,
    createDecompressor
} from "~/tasks/utils/decompressor/index.js";
import { createMultipartUpload, createMultipartUploadFactory } from "~/tasks/utils/upload/index.js";
import { FileFetcher } from "~/tasks/utils/fileFetcher/index.js";

export const createImportFromUrlProcessAssets = <
    I extends IImportFromUrlProcessAssetsInput = IImportFromUrlProcessAssetsInput,
    O extends IImportFromUrlProcessAssetsOutput = IImportFromUrlProcessAssetsOutput
>(
    context: Context
): IImportFromUrlProcessAssets<I, O> => {
    const client = createS3Client();
    const bucket = getBucket();
    const reader = createCompressedFileReader({
        client,
        bucket
    });
    const decompressor = createDecompressor({
        createUploadFactory: filename => {
            return createMultipartUploadFactory({
                filename,
                client,
                bucket,
                createHandler: createMultipartUpload
            });
        }
    });

    const fileFetcher = new FileFetcher({
        client,
        bucket
    });

    return new ImportFromUrlProcessAssets<I, O>({
        context,
        fileFetcher,
        reader,
        decompressor
    });
};
