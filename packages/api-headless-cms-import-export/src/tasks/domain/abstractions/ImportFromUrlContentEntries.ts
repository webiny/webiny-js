import { Context, ICmsImportExportValidatedCombinedContentFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";

export interface IImportFromUrlContentEntriesInputDownloadValues {
    current: number;
    done: boolean;
}

export interface IImportFromUrlContentEntriesDecompressInputValues {
    done: boolean;
}

export interface IImportFromUrlContentEntriesInput {
    modelId: string;
    file: ICmsImportExportValidatedCombinedContentFile;
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
