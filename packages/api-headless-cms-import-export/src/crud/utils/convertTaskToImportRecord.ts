import { ITask } from "@webiny/tasks";
import { ICmsImportExportObjectImportFromUrlResult } from "~/types";
import {
    IImportFromUrlControllerInput,
    IImportFromUrlControllerOutput
} from "~/tasks/domain/abstractions/ImportFromUrlController";

export const convertTaskToImportRecord = (
    task: ITask<IImportFromUrlControllerInput, IImportFromUrlControllerOutput>
): ICmsImportExportObjectImportFromUrlResult => {
    return {
        id: task.id,
        status: task.taskStatus,
        files: task.output?.files,
        error: task.output?.error
    };
};
