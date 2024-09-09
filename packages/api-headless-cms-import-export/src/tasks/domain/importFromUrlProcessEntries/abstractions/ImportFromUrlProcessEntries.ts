import { Context, ICmsImportExportValidatedValidFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";

export type IImportFromUrlProcessEntriesInputFile = Pick<
    ICmsImportExportValidatedValidFile,
    "key" | "type"
>;

export interface IImportFromUrlProcessEntriesInput {
    modelId: string;
    file: IImportFromUrlProcessEntriesInputFile;
    decompress?: {
        done?: boolean;
        files?: string[];
        next?: number;
    };
    insert?: {
        done?: boolean;
    };
}

export interface IImportFromUrlProcessEntriesOutputFile {
    key: string;
    entries: number;
}

export interface IImportFromUrlProcessEntriesOutput extends ITaskResponseDoneResultOutput {
    files: IImportFromUrlProcessEntriesOutputFile[];
}

export interface IImportFromUrlProcessEntries<
    C extends Context = Context,
    I extends IImportFromUrlProcessEntriesInput = IImportFromUrlProcessEntriesInput,
    O extends IImportFromUrlProcessEntriesOutput = IImportFromUrlProcessEntriesOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
