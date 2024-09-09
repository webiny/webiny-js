import {
    IImportFromUrlProcessEntriesInsert,
    IImportFromUrlProcessEntriesInsertRunParams,
    IImportFromUrlProcessEntriesInsertRunResult
} from "./abstractions/ImportFromUrlProcessEntriesInsert";
import { S3Client } from "@webiny/aws-sdk/client-s3";
import {
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries";
import { ICmsEntryManager } from "@webiny/api-headless-cms/types";
import { Context } from "~/types";
import { MANIFEST_JSON } from "~/tasks/constants";
import { IFileFetcher } from "~/tasks/utils/fileFetcher";

export interface IImportFromUrlProcessEntriesInsertParams {
    entryManager: ICmsEntryManager;
    client: S3Client;
    fileFetcher: IFileFetcher;
}

export class ImportFromUrlProcessEntriesInsert<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntriesInsert<C, I, O>
{
    private readonly entryManager: ICmsEntryManager;
    private readonly client: S3Client;
    private readonly fileFetcher: IFileFetcher;

    public constructor(params: IImportFromUrlProcessEntriesInsertParams) {
        this.entryManager = params.entryManager;
        this.client = params.client;
        this.fileFetcher = params.fileFetcher;
    }

    public async run(
        params: IImportFromUrlProcessEntriesInsertRunParams<C, I, O>
    ): Promise<IImportFromUrlProcessEntriesInsertRunResult<I, O>> {
        const { response, input } = params;

        const files = (input.decompress?.files || []).filter(file => !file.endsWith(MANIFEST_JSON));
        if (files.length === 0) {
            return response.error({
                message: `No entry files found in the compressed archive.`,
                code: "NO_FILES_FOUND",
                data: {
                    files: input.decompress?.files || []
                }
            });
        }

        let result = structuredClone(input);

        for (const file of files) {
            const contents = await this.fileFetcher.fetch(file);
        }

        return response.error({
            message: `Not implemented.`,
            code: "NOT_IMPLEMENTED",
            data: input
        });
    }
}
