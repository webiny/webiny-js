import { ITaskManagerStore } from "@webiny/tasks";
import { TaskCache } from "./TaskCache";
import {
    EntriesTask,
    HcmsTasksContext,
    IBulkActionOperationByModelInput,
    IBulkActionOperationInput
} from "~/types";

export class TaskTrigger {
    constructor(private taskCache: TaskCache) {}

    async execute(
        context: HcmsTasksContext,
        store: ITaskManagerStore<IBulkActionOperationByModelInput>
    ) {
        const tasks = this.taskCache.getTasks();
        if (tasks.length === 0) {
            return;
        }

        for (const task of tasks) {
            try {
                await context.tasks.trigger<IBulkActionOperationInput>({
                    definition: EntriesTask.DeleteEntries,
                    name: `Headless CMS - Delete Entries - ${task.modelId}`,
                    parent: store.getTask(),
                    input: {
                        modelId: task.modelId,
                        ids: task.ids,
                        identity: task.identity
                    }
                });
            } catch (error) {
                console.error(`Error triggering task for model ${task.modelId}:`, error);
            }
        }

        // Clear the cache after processing
        this.taskCache.clear();
    }
}
