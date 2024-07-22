import { Context, ICmsImportExportProcessedFile, ICmsImportExportValidatedFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { NonEmptyArray } from "@webiny/api/types";

export interface IImportFromUrlControllerInput {
    modelId: string;
    files: NonEmptyArray<ICmsImportExportValidatedFile>;
}

export interface IImportFromUrlControllerOutput extends ITaskResponseDoneResultOutput {
    files: NonEmptyArray<ICmsImportExportProcessedFile>;
}

export interface IImportFromUrlController<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
