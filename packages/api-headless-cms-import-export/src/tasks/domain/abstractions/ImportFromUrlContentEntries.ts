import { Context, ICmsImportExportValidatedContentEntriesFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { NonEmptyArray } from "@webiny/api/types";
import { ITag } from "~/tasks/utils/upload";

export interface IImportFromUrlContentEntriesInputDownloadValues {
    nextRange: number;
    done: boolean;
    uploadId?: string;
    tags?: NonEmptyArray<ITag>;
    uploadPart?: number;
}

export interface IImportFromUrlContentEntriesDecompressInputValues {
    done: boolean;
}

export interface IImportFromUrlContentEntriesInput {
    modelId: string;
    file: ICmsImportExportValidatedContentEntriesFile;
    /**
     * Combined content entries file information / processing.
     */
    download?: IImportFromUrlContentEntriesInputDownloadValues;
    decompress?: IImportFromUrlContentEntriesDecompressInputValues;
}

export interface IImportFromUrlContentEntriesOutput extends ITaskResponseDoneResultOutput {
    file: string;
}

export interface IImportFromUrlContentEntries<
    C extends Context = Context,
    I extends IImportFromUrlContentEntriesInput = IImportFromUrlContentEntriesInput,
    O extends IImportFromUrlContentEntriesOutput = IImportFromUrlContentEntriesOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
