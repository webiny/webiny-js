import type { ICmsImportExportValidatedValidFile } from "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IImportFromUrlDownloadInput {
    modelId: string;
    file: ICmsImportExportValidatedValidFile;
    nextRange?: number;
    done?: boolean;
    uploadId?: string;
}

export interface IImportFromUrlDownloadOutput extends TaskDefinition.TaskOutput {
    file: string;
}

export interface IImportFromUrlDownload<
    I extends IImportFromUrlDownloadInput = IImportFromUrlDownloadInput,
    O extends IImportFromUrlDownloadOutput = IImportFromUrlDownloadOutput
> {
    run(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
