import type { Context, ICmsImportExportValidatedValidFile } from "~/types";
import type {
    ITaskResponseDoneResultOutput,
    ITaskResponseResult,
    ITaskRunParams
} from "@webiny/tasks";

export type IImportFromUrlProcessEntriesInputFile = Pick<
    ICmsImportExportValidatedValidFile,
    "key" | "type"
>;

export interface IImportFromUrlProcessEntriesInsertFailedFileInput {
    key: string;
    message: string;
}

export interface IImportFromUrlProcessEntriesInsertProcessedFileErrorsInput {
    message: string;
    id: string;
}

export interface IImportFromUrlProcessEntriesInsertProcessedFileInput {
    key: string;
    success: number;
    total: number;
    errors: IImportFromUrlProcessEntriesInsertProcessedFileErrorsInput[];
}
export interface IImportFromUrlProcessEntriesInsertInput {
    processed?: IImportFromUrlProcessEntriesInsertProcessedFileInput[];
    failed?: IImportFromUrlProcessEntriesInsertFailedFileInput[];
    file?: string;
    done?: boolean;
}

export interface IImportFromUrlProcessEntriesInput {
    modelId: string;
    file: IImportFromUrlProcessEntriesInputFile;
    maxInsertErrors: number | undefined;
    decompress?: {
        done?: boolean;
        files?: string[];
        next?: number;
    };
    insert?: IImportFromUrlProcessEntriesInsertInput;
}

export interface IImportFromUrlProcessEntriesOutputFile {
    key: string;
    success: number;
    total: number;
    errors: IImportFromUrlProcessEntriesInsertProcessedFileErrorsInput[];
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
