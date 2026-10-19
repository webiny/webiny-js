import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { ITaskLog } from "~/api/types.js";

export const entryToTaskLog = (entry: CmsEntry): ITaskLog => {
    return {
        id: entry.entryId,
        createdOn: entry.createdOn,
        createdBy: entry.createdBy,
        executionName: entry.values.executionName,
        task: entry.values.task,
        iteration: entry.values.iteration,
        items: entry.values.items || []
    };
};
