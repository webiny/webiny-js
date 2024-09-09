import { S3Client } from "@webiny/aws-sdk/client-s3";
import { CmsImportExportFileType, Context } from "~/types";
import {
    IImportFromUrlProcessEntries,
    IImportFromUrlProcessEntriesInput,
    IImportFromUrlProcessEntriesOutput
} from "./abstractions/ImportFromUrlProcessEntries";
import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { ICmsEntryManager } from "@webiny/api-headless-cms/types";
import { ImportFromUrlProcessEntriesInsert } from "~/tasks/domain/importFromUrlProcessEntries/ImportFromUrlProcessEntriesInsert";
import { ImportFromUrlProcessEntriesDecompress } from "~/tasks/domain/importFromUrlProcessEntries/ImportFromUrlProcessEntriesDecompress";

export interface IImportFromUrlProcessEntriesParams {
    client: S3Client;
    bucket: string;
}

export class ImportFromUrlProcessEntries<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> implements IImportFromUrlProcessEntries<C, I, O>
{
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(params: IImportFromUrlProcessEntriesParams) {
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, isCloseToTimeout, isAborted } = params;

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
                    client: this.client,
                    bucket: this.bucket
                });

                return await decompress.run(params);
            } catch (ex) {
                return response.error({
                    message: ex.message,
                    code: ex.code || "DECOMPRESS_ERROR",
                    data: ex.data,
                    stack: ex.stack
                });
            }
        } else if (!input.insert?.done) {
            let result: I = structuredClone(input);

            try {
                const insert = new ImportFromUrlProcessEntriesInsert<C, I, O>({
                    entryManager,
                    client: this.client
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

        return response.error("Unknown step.");
    }
}
