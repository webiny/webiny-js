import type { ITask } from "@webiny/tasks";
import type { ICmsImportExportObjectImportFromUrlResult } from "~/types";
import type {
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
