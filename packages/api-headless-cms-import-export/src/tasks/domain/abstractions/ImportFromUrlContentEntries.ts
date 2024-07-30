import { Context, ICmsImportExportValidatedCombinedContentFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";

export interface IImportFromUrlContentEntriesInputValues {
    current: number;
    done: boolean;
}

export interface IImportFromUrlContentEntriesInput {
    modelId: string;
    file: ICmsImportExportValidatedCombinedContentFile;
    /**
     * Combined content entries file information / processing.
     */
    combinedFile?: IImportFromUrlContentEntriesInputValues;
}

export interface IImportFromUrlContentEntriesOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    invalid: string[];
    aborted: string[];
    failed: string[];
}

export interface IImportFromUrlContentEntries<
    C extends Context = Context,
    I extends IImportFromUrlContentEntriesInput = IImportFromUrlContentEntriesInput,
    O extends IImportFromUrlContentEntriesOutput = IImportFromUrlContentEntriesOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
