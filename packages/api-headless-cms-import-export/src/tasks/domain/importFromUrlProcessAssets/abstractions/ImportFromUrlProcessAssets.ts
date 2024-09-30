import type {
    ITaskResponseDoneResultOutput,
    ITaskResponseResult,
    ITaskRunParams
} from "@webiny/tasks";
import type { Context, ICmsImportExportValidatedValidFile } from "~/types";

export type IImportFromUrlProcessAssetsInputFile = Pick<
    ICmsImportExportValidatedValidFile,
    "key" | "type"
>;

export interface IImportFromUrlProcessAssetsInputError {
    file: string;
    message: string;
}

export interface IImportFromUrlProcessAssetsInput {
    modelId: string;
    file: IImportFromUrlProcessAssetsInputFile;
    maxInsertErrors?: number;
    override?: boolean;
    manifest?: string;
    lastAsset?: string;
    errors?: IImportFromUrlProcessAssetsInputError[];
}

export type IImportFromUrlProcessAssetsOutput = ITaskResponseDoneResultOutput;

export interface IImportFromUrlProcessAssets<
    C extends Context = Context,
    I extends IImportFromUrlProcessAssetsInput = IImportFromUrlProcessAssetsInput,
    O extends IImportFromUrlProcessAssetsOutput = IImportFromUrlProcessAssetsOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
