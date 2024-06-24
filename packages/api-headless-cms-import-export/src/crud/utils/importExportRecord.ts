import { ITask } from "@webiny/tasks";
import { ICmsImportExportTaskOutput, ICmsImportExportTaskParams } from "~/types";
import { createCmsImportExportRecord } from "~/domain/CmsImportExportRecord";

export const convertTaskToCmsImportExportRecord = (
    task: ITask<ICmsImportExportTaskParams, ICmsImportExportTaskOutput>
) => {
    return createCmsImportExportRecord({
        id: task.id,
        createdOn: task.createdOn,
        createdBy: task.createdBy,
        finishedOn: task.finishedOn || null,
        modelId: task.input.modelId,
        file: task.output?.file || null,
        url: task.output?.url || null,
        expiresOn: task.output?.expiresOn || null,
        status: task.taskStatus
    });
};
