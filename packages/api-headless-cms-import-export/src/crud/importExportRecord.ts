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
        finishedOn: task.finishedOn,
        modelId: task.input.modelId,
        file: task.output?.file,
        url: task.output?.url,
        status: task.taskStatus
    });
};
