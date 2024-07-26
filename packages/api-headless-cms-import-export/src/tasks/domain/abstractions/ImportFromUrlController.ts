import { Context, ICmsImportExportValidatedFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { NonEmptyArray } from "@webiny/api/types";

export interface IImportFromUrlControllerInput {
    modelId: string;
    files: NonEmptyArray<ICmsImportExportValidatedFile>;
    importing: boolean;
}

export interface IImportFromUrlControllerOutput extends ITaskResponseDoneResultOutput {
    done: string[];
    invalid: string[];
    aborted: string[];
    failed: string[];
}

export interface IImportFromUrlController<
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
