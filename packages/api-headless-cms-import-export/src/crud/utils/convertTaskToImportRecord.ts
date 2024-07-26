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
        done: task.output?.done || [],
        aborted: task.output?.aborted || [],
        invalid: task.output?.invalid || [],
        failed: task.output?.failed || [],
        error: task.output?.error
    };
};
