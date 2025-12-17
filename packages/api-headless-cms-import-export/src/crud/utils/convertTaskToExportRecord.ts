import type { ITask } from "@webiny/tasks";
import { createCmsImportExportRecord } from "~/domain/CmsImportExportRecord.js";
import type {
    IControllerInput,
    IControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController.js";

export const convertTaskToCmsExportRecord = (task: ITask<IControllerInput, IControllerOutput>) => {
    return createCmsImportExportRecord({
        id: task.id,
        createdOn: task.createdOn,
        createdBy: task.createdBy,
        finishedOn: task.finishedOn || null,
        modelId: task.input.modelId,
        exportAssets: task.input.exportAssets,
        files: task.output?.files || null,
        status: task.taskStatus
    });
};
