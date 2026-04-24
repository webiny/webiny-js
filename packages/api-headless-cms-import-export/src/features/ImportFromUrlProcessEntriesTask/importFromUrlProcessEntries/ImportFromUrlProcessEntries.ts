import type { Context } from "~/types.js";
import { CmsImportExportFileType } from "~/types.js";
import type {
    IImportFromUrlProcessEntries,
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries.js";
import { ImportFromUrlProcessEntriesDecompress } from "./ImportFromUrlProcessEntriesDecompress.js";
import type { IFileFetcher } from "~/tasks/utils/fileFetcher/index.js";
import { ImportFromUrlProcessEntriesInsert } from "./ImportFromUrlProcessEntriesInsert.js";
import type { ICompressedFileReader, IDecompressor } from "~/tasks/utils/decompressor/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IImportFromUrlProcessEntriesParams {
    context: Context;
    fileFetcher: IFileFetcher;
    reader: ICompressedFileReader;
    decompressor: IDecompressor;
}

export class ImportFromUrlProcessEntries<
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntries<I, O> {
    private readonly context: Context;
    private readonly fileFetcher: IFileFetcher;
    private readonly reader: ICompressedFileReader;
    private readonly decompressor: IDecompressor;

    public constructor(params: IImportFromUrlProcessEntriesParams) {
        this.context = params.context;
        this.fileFetcher = params.fileFetcher;
        this.reader = params.reader;
        this.decompressor = params.decompressor;
    }

    public async run(params: TaskDefinition.RunParams<I, O>) {
        const { input, controller } = params;

        const getModel = this.context.container.resolve(GetModelUseCase);
        const createEntry = this.context.container.resolve(CreateEntryUseCase);

        if (!input.modelId) {
            return controller.response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (!input.file) {
            return controller.response.error({
                message: `No file found in the provided data.`,
                code: "NO_FILE_FOUND"
            });
        } else if (input.file.type !== CmsImportExportFileType.ENTRIES) {
            return controller.response.error({
                message: `Invalid file type. Expected "${CmsImportExportFileType.ENTRIES}" but got "${input.file.type}".`,
                code: "INVALID_FILE_TYPE"
            });
        }

        const modelResult = await getModel.execute(input.modelId);
        if (modelResult.isFail()) {
            return controller.response.error({
                message: `Model "${input.modelId}" not found.`,
                code: "MODEL_NOT_FOUND"
            });
        }

        if (!input.decompress?.done) {
            try {
                const decompress = new ImportFromUrlProcessEntriesDecompress<I, O>({
                    reader: this.reader,
                    decompressor: this.decompressor
                });

                return await decompress.run(params);
            } catch (ex) {
                console.error(ex);
                return controller.response.error({
                    message: ex.message,
                    code: ex.code || "DECOMPRESS_ERROR",
                    data: ex.data,
                    stack: ex.stack
                });
            }
        }

        try {
            const insert = new ImportFromUrlProcessEntriesInsert<I, O>({
                model: modelResult.value,
                createEntry,
                fileFetcher: this.fileFetcher
            });
            return await insert.run(params);
        } catch (ex) {
            return controller.response.error({
                message: ex.message,
                code: ex.code || "DECOMPRESS_ERROR",
                data: ex.data,
                stack: ex.stack
            });
        }
    }
}
