import { ITask } from "@webiny/tasks";
import { createCmsImportExportRecord } from "~/domain/CmsImportExportRecord";
import {
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController";

export const convertTaskToCmsImportExportRecord = (
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
        expiresOn: task.output?.expiresOn || null,
        status: task.taskStatus
    });
};
