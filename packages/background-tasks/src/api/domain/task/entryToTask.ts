import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";

export const entryToTask = <
    I extends TaskService.TaskInput = TaskService.TaskInput,
    O extends TaskService.GenericOutput = TaskService.GenericOutput
>(
    entry: CmsEntry
): TaskService.Task<I, O> => {
    return {
        id: entry.entryId,
        createdOn: entry.createdOn,
        savedOn: entry.savedOn,
        createdBy: entry.createdBy,
        name: entry.values.name,
        definitionId: entry.values.definitionId,
        input: entry.values.input,
        output: entry.values.output,
        taskStatus: entry.values.taskStatus,
        executionName: entry.values.executionName || "",
        eventResponse: entry.values.eventResponse,
        startedOn: entry.values.startedOn,
        finishedOn: entry.values.finishedOn,
        iterations: entry.values.iterations,
        parentId: entry.values.parentId
    };
};
