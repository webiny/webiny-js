import { Context } from "~/types";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { ImportFromUrlProcessAssets } from "./importFromUrlProcessAssets/ImportFromUrlProcessAssets";
import type {
    IImportFromUrlProcessAssets,
    IImportFromUrlProcessAssetsInput,
    IImportFromUrlProcessAssetsOutput
} from "./importFromUrlProcessAssets/abstractions/ImportFromUrlProcessAssets";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createCompressedFileReader, createDecompressor } from "~/tasks/utils/decompressor";
import { createMultipartUpload, createMultipartUploadFactory } from "~/tasks/utils/upload";
import { FileFetcher } from "~/tasks/utils/fileFetcher";

export const createImportFromUrlProcessAssets = <
    C extends Context = Context,
    I extends IImportFromUrlProcessAssetsInput = IImportFromUrlProcessAssetsInput,
    O extends IImportFromUrlProcessAssetsOutput = IImportFromUrlProcessAssetsOutput
>(): IImportFromUrlProcessAssets<C, I, O> => {
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

    return new ImportFromUrlProcessAssets<C, I, O>({
        fileFetcher,
        reader,
        decompressor
    });
};
