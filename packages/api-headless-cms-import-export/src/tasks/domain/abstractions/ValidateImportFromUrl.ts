import type { ICmsImportExportFile, ICmsImportExportValidatedFile } from "~/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IExportedCmsModel } from "~/tasks/domain/abstractions/ExportContentEntriesController.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IValidateImportFromUrlInput {
    files: NonEmptyArray<ICmsImportExportFile>;
    model: IExportedCmsModel;
}

export interface IValidateImportFromUrlOutput extends TaskDefinition.TaskOutput {
    modelId: string;
    files: NonEmptyArray<ICmsImportExportValidatedFile>;
    importTaskId?: string;
}

export interface IValidateImportFromUrl<
    I extends IValidateImportFromUrlInput = IValidateImportFromUrlInput,
    O extends IValidateImportFromUrlOutput = IValidateImportFromUrlOutput
> {
    run(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
