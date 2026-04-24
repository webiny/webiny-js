import type {
    ICmsImportExportValidatedAssetsFile,
    ICmsImportExportValidatedContentEntriesFile
} from "~/types.js";
import type { NonEmptyArray } from "@webiny/api/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export enum IImportFromUrlControllerInputStep {
    DOWNLOAD = "download",
    PROCESS_ENTRIES = "processEntries",
    PROCESS_ASSETS = "processAssets"
}

export interface IImportFromUrlControllerInputStepsStep {
    files: string[];
    triggered: boolean;
    finished: boolean;
    done: string[];
    failed: string[];
    invalid: string[];
    aborted: string[];
}

export interface IImportFromUrlControllerInputSteps {
    [IImportFromUrlControllerInputStep.DOWNLOAD]?: IImportFromUrlControllerInputStepsStep;
    [IImportFromUrlControllerInputStep.PROCESS_ENTRIES]?: IImportFromUrlControllerInputStepsStep;
    [IImportFromUrlControllerInputStep.PROCESS_ASSETS]?: IImportFromUrlControllerInputStepsStep;
}

export interface IImportFromUrlControllerInput {
    modelId: string;
    files: NonEmptyArray<
        ICmsImportExportValidatedContentEntriesFile | ICmsImportExportValidatedAssetsFile
    >;
    maxInsertErrors: number | undefined;
    steps: IImportFromUrlControllerInputSteps;
}

export interface IImportFromUrlControllerOutput extends TaskDefinition.TaskOutput {
    /**
     * Should contain all local files created by the import process.
     */
    files: string[];
    done: string[];
    invalid: string[];
    aborted: string[];
    failed: string[];
}

export interface IImportFromUrlController<
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> {
    run(params: TaskDefinition.RunParams<I, O>): Promise<TaskDefinition.Result<I, O>>;
}
