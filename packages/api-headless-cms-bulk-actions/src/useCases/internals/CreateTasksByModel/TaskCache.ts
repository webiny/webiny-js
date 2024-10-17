import { HcmsBulkActionsContext } from "~/types";
import { ITask, ITaskDataInput } from "@webiny/tasks";

/**
 * TaskCache class for managing and triggering cached tasks.
 * @template TTask - Task input data.
 */
export class TaskCache<TTask = ITaskDataInput> {
    private readonly taskDefinition: string;
    private taskCache: TTask[] = [];

    constructor(taskDefinition: string) {
        this.taskDefinition = taskDefinition;
    }

    /**
     * Adds a task to the cache.
     * @param {TTask} item - The task input data to be cached.
     */
    cacheTask(item: TTask) {
        this.taskCache.push(item);
    }

    /**
     * Triggers all cached tasks using the provided context and parent task.
     * @param {HcmsBulkActionsContext} context - The context used to trigger the tasks.
     * @param {ITask} parent - The parent task to associate with the triggered tasks.
     */
    async triggerTask(context: HcmsBulkActionsContext, parent: ITask) {
        const tasks = this.getTasks();

        if (tasks.length === 0) {
            return;
        }

        for (const task of tasks) {
            try {
                await context.tasks.trigger<TTask>({
                    definition: this.taskDefinition,
                    parent,
                    input: task
                });
            } catch (error) {
                console.error(`Error triggering task.`, error);
            }
        }

        // Clear the cache after processing
        this.clearTasks();
    }

    /**
     * Retrieves the cached tasks length.
     * @returns number
     */
    getTasksLength() {
        return this.getTasks().length;
    }

    /**
     * Retrieves the cached tasks.
     * @returns {TTask[]} The list of cached tasks.
     */
    private getTasks() {
        return this.taskCache;
    }

    /**
     * Clears all cached tasks.
     */
    private clearTasks() {
        this.taskCache = [];
    }
}
