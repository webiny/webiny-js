import type { ITask } from "@webiny/tasks";
import { createCmsImportExportRecord } from "~/domain/CmsImportExportRecord";
import type {
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController";

export const convertTaskToCmsExportRecord = (
    task: ITask<IExportContentEntriesControllerInput, IExportContentEntriesControllerOutput>
) => {
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
