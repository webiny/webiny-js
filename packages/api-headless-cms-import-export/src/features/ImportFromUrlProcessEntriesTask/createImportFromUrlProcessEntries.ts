import type { Context } from "~/types.js";
import { createS3Client } from "~/tasks/utils/helpers/s3Client.js";
import { ImportFromUrlProcessEntries } from "./importFromUrlProcessEntries/ImportFromUrlProcessEntries.js";
import type {
    IImportFromUrlProcessEntries,
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./importFromUrlProcessEntries/abstractions/ImportFromUrlProcessEntries.js";
import { getBucket } from "~/tasks/utils/helpers/getBucket.js";
import {
    createCompressedFileReader,
    createDecompressor
} from "~/tasks/utils/decompressor/index.js";
import { createMultipartUpload, createMultipartUploadFactory } from "~/tasks/utils/upload/index.js";
import { FileFetcher } from "~/tasks/utils/fileFetcher/index.js";

export const createImportFromUrlProcessEntries = <
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
>(
    context: Context
): IImportFromUrlProcessEntries<Context, I, O> => {
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

    return new ImportFromUrlProcessEntries<I, O>({
        context,
        fileFetcher,
        reader,
        decompressor
    });
};
