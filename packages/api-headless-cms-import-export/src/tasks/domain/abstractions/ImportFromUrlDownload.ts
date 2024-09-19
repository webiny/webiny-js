import type { Context, ICmsImportExportValidatedValidFile } from "~/types";
import type {
    ITaskResponseDoneResultOutput,
    ITaskResponseResult,
    ITaskRunParams
} from "@webiny/tasks";

export interface IImportFromUrlDownloadInput {
    modelId: string;
    file: ICmsImportExportValidatedValidFile;
    nextRange?: number;
    done?: boolean;
    uploadId?: string;
}

export interface IImportFromUrlDownloadOutput extends ITaskResponseDoneResultOutput {
    file: string;
}

export interface IImportFromUrlDownload<
    C extends Context = Context,
    I extends IImportFromUrlDownloadInput = IImportFromUrlDownloadInput,
    O extends IImportFromUrlDownloadOutput = IImportFromUrlDownloadOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
