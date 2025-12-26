import type { ICmsImportExportValidatedValidFile } from "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

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

export type IImportFromUrlProcessAssetsOutput = TaskDefinition.TaskOutput;

export interface IImportFromUrlProcessAssets<
    I extends IImportFromUrlProcessAssetsInput = IImportFromUrlProcessAssetsInput,
    O extends IImportFromUrlProcessAssetsOutput = IImportFromUrlProcessAssetsOutput
> {
    run(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
