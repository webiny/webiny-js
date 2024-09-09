import { Context } from "~/types";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { ImportFromUrlProcessEntries } from "./importFromUrlProcessEntries/ImportFromUrlProcessEntries";
import {
    IImportFromUrlProcessEntries,
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./importFromUrlProcessEntries/abstractions/ImportFromUrlProcessEntries";
import { getBucket } from "~/tasks/utils/helpers/getBucket";

export const createImportFromUrlProcessEntries = <
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
>(): IImportFromUrlProcessEntries<C, I, O> => {
    const client = createS3Client();
    const bucket = getBucket();

    return new ImportFromUrlProcessEntries<C, I, O>({
        client,
        bucket
    });
};
