import { Context, ICmsImportExportFile } from "~/types";
import { ITaskResponseResult, ITaskRunParams, ITaskResponseDoneResultOutput } from "@webiny/tasks";

export interface IImportContentEntriesControllerInput {
    modelId: string;
    files: ICmsImportExportFile[];
}

export interface IImportContentEntriesControllerOutput extends ITaskResponseDoneResultOutput {
    files: ICmsImportExportFile[];
}

export interface IImportContentEntriesController<
    C extends Context = Context,
    I extends IImportContentEntriesControllerInput = IImportContentEntriesControllerInput,
    O extends IImportContentEntriesControllerOutput = IImportContentEntriesControllerOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
