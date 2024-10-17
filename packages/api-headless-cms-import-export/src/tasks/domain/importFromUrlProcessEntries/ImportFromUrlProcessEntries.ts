import type { Context } from "~/types";
import { CmsImportExportFileType } from "~/types";
import type {
    IImportFromUrlProcessEntries,
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries";
import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import type { ICmsEntryManager } from "@webiny/api-headless-cms/types";
import { ImportFromUrlProcessEntriesDecompress } from "~/tasks/domain/importFromUrlProcessEntries/ImportFromUrlProcessEntriesDecompress";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher";
import { ImportFromUrlProcessEntriesInsert } from "./ImportFromUrlProcessEntriesInsert";
import type { ICompressedFileReader, IDecompressor } from "~/tasks/utils/decompressor";

export interface IImportFromUrlProcessEntriesParams {
    fileFetcher: IFileFetcher;
    reader: ICompressedFileReader;
    decompressor: IDecompressor;
}

export class ImportFromUrlProcessEntries<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntries<C, I, O>
{
    private readonly fileFetcher: IFileFetcher;
    private readonly reader: ICompressedFileReader;
    private readonly decompressor: IDecompressor;

    public constructor(params: IImportFromUrlProcessEntriesParams) {
        this.fileFetcher = params.fileFetcher;
        this.reader = params.reader;
        this.decompressor = params.decompressor;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input } = params;

        if (!input.modelId) {
            return response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (!input.file) {
            return response.error({
                message: `No file found in the provided data.`,
                code: "NO_FILE_FOUND"
            });
        } else if (input.file.type !== CmsImportExportFileType.ENTRIES) {
            return response.error({
                message: `Invalid file type. Expected "${CmsImportExportFileType.ENTRIES}" but got "${input.file.type}".`,
                code: "INVALID_FILE_TYPE"
            });
        }

        let entryManager: ICmsEntryManager;
        try {
            entryManager = await context.cms.getEntryManager(input.modelId);
        } catch (ex) {
            return response.error({
                message: `Model "${input.modelId}" not found.`,
                code: "MODEL_NOT_FOUND"
            });
        }

        if (!input.decompress?.done) {
            try {
                const decompress = new ImportFromUrlProcessEntriesDecompress<C, I, O>({
                    reader: this.reader,
                    decompressor: this.decompressor
                });

                return await decompress.run(params);
            } catch (ex) {
                console.error(ex);
                return response.error({
                    message: ex.message,
                    code: ex.code || "DECOMPRESS_ERROR",
                    data: ex.data,
                    stack: ex.stack
                });
            }
        }

        try {
            const insert = new ImportFromUrlProcessEntriesInsert<C, I, O>({
                entryManager,
                fileFetcher: this.fileFetcher
            });
            return await insert.run(params);
        } catch (ex) {
            return response.error({
                message: ex.message,
                code: ex.code || "DECOMPRESS_ERROR",
                data: ex.data,
                stack: ex.stack
            });
        }
    }
}
