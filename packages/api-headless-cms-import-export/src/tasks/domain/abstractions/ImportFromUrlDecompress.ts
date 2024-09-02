import { Context, ICmsImportExportValidatedValidFile } from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { NonEmptyArray } from "@webiny/api/types";
import { ITag } from "~/tasks/utils/upload";

export interface IImportFromUrlDecompressInput {
    modelId: string;
    file: ICmsImportExportValidatedValidFile;
    nextRange?: number;
    done?: boolean;
    uploadId?: string;
    tags?: NonEmptyArray<ITag>;
    uploadPart?: number;
}

export interface IImportFromUrlDecompressOutput extends ITaskResponseDoneResultOutput {
    file: string;
}

export interface IImportFromUrlDecompress<
    C extends Context = Context,
    I extends IImportFromUrlDecompressInput = IImportFromUrlDecompressInput,
    O extends IImportFromUrlDecompressOutput = IImportFromUrlDecompressOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
