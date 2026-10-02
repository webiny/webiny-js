import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TriggerTaskUseCase } from "@webiny/background-tasks/api";

export interface ITriggerTasksResult {
    triggered: number;
    failures: Error[];
}

/**
 * TaskCache class for managing and triggering cached tasks.
 * @template TTask - Task input data.
 */
export class TaskCache<TTask extends TaskDefinition.TaskInput = TaskDefinition.TaskInput> {
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
     * Triggers all cached tasks and REPORTS what happened, rather than deciding for the caller.
     *
     * A trigger failure used to be logged and dropped here, which left the parent waiting on
     * subtasks that were never created — it advances to PROCESS_SUBTASKS either way, finds no
     * running children, and loops. Returning the failures lets the caller end the task when
     * nothing could be dispatched.
     *
     * @param {TriggerTaskUseCase.Interface} triggerTask - The use case used to trigger the tasks.
     * @param {ITask} parent - The parent task to associate with the triggered tasks.
     */
    async triggerTask(
        triggerTask: TriggerTaskUseCase.Interface,
        parent: TaskDefinition.Task
    ): Promise<ITriggerTasksResult> {
        const tasks = this.getTasks();
        const result: ITriggerTasksResult = { triggered: 0, failures: [] };

        if (tasks.length === 0) {
            return result;
        }

        for (const task of tasks) {
            try {
                await triggerTask.execute<TTask>({
                    definition: this.taskDefinition,
                    parent,
                    input: task
                });
                result.triggered++;
            } catch (ex) {
                result.failures.push(ex instanceof Error ? ex : new Error(String(ex)));
            }
        }

        // Clear the cache after processing
        this.clearTasks();

        return result;
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
