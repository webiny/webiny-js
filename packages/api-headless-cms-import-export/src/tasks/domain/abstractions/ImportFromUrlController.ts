import {
    Context,
    ICmsImportExportValidatedAssetsFile,
    ICmsImportExportValidatedContentEntriesFile
} from "~/types";
import { ITaskResponseDoneResultOutput, ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { NonEmptyArray } from "@webiny/api/types";

export enum IImportFromUrlControllerInputStep {
    DOWNLOAD = "download",
    PROCESS_ENTRIES = "processEntries",
    PROCESS_ASSETS = "processAssets"
}

export interface IImportFromUrlControllerInputSteps {
    [IImportFromUrlControllerInputStep.DOWNLOAD]?: {
        files: string[];
        triggered: boolean;
        finished: boolean;
        done: string[];
        failed: string[];
        invalid: string[];
        aborted: string[];
    };
    [IImportFromUrlControllerInputStep.PROCESS_ENTRIES]?: {
        files: string[];
        triggered: boolean;
        finished: boolean;
        done: string[];
        failed: string[];
        invalid: string[];
        aborted: string[];
    };
    [IImportFromUrlControllerInputStep.PROCESS_ASSETS]?: {
        files: string[];
        triggered: boolean;
        finished: boolean;
        done: string[];
        failed: string[];
        invalid: string[];
        aborted: string[];
    };
}

export interface IImportFromUrlControllerInput {
    modelId: string;
    files: NonEmptyArray<
        ICmsImportExportValidatedContentEntriesFile | ICmsImportExportValidatedAssetsFile
    >;
    maxInsertErrors: number | undefined;
    steps: IImportFromUrlControllerInputSteps;
}

export interface IImportFromUrlControllerOutput extends ITaskResponseDoneResultOutput {
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
    C extends Context = Context,
    I extends IImportFromUrlControllerInput = IImportFromUrlControllerInput,
    O extends IImportFromUrlControllerOutput = IImportFromUrlControllerOutput
> {
    run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>>;
}
