import { Context, ICmsImportExportValidatedAssetsFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";

export interface IImportFromUrlAssetsInput {
    modelId: string;
    file: ICmsImportExportValidatedAssetsFile;
}

export interface IImportFromUrlAssetsOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    invalid: string[];
    aborted: string[];
    failed: string[];
}

export interface IImportFromUrlAssets<
    C extends Context = Context,
    I extends IImportFromUrlAssetsInput = IImportFromUrlAssetsInput,
    O extends IImportFromUrlAssetsOutput = IImportFromUrlAssetsOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
