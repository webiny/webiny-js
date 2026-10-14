import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TriggerTaskUseCase } from "@webiny/background-tasks/api";
import type { Logger } from "@webiny/api-core/features/logger/index.js";

/**
 * TaskCache class for managing and triggering cached tasks.
 * @template TTask - Task input data.
 */
export class TaskCache<TTask extends TaskDefinition.TaskInput = TaskDefinition.TaskInput> {
    private readonly taskDefinition: string;
    private taskCache: TTask[] = [];
    private readonly logger: Logger.Interface;

    constructor(taskDefinition: string, logger: Logger.Interface) {
        this.taskDefinition = taskDefinition;
        this.logger = logger;
    }

    /**
     * Adds a task to the cache.
     * @param {TTask} item - The task input data to be cached.
     */
    cacheTask(item: TTask) {
        this.taskCache.push(item);
    }

    /**
     * Triggers all cached tasks using the provided TriggerTaskUseCase and parent task.
     * @param {TriggerTaskUseCase.Interface} triggerTask - The use case used to trigger the tasks.
     * @param {ITask} parent - The parent task to associate with the triggered tasks.
     */
    async triggerTask(triggerTask: TriggerTaskUseCase.Interface, parent: TaskDefinition.Task) {
        const tasks = this.getTasks();

        if (tasks.length === 0) {
            return;
        }

        for (const task of tasks) {
            try {
                const result = await triggerTask.execute<TTask>({
                    definition: this.taskDefinition,
                    parent,
                    input: task
                });
                // A failed trigger comes back as a Result as well as a throw; log both.
                if (result.isFail()) {
                    this.logger.error({ error: result.error }, "Error triggering task.");
                }
            } catch (error) {
                this.logger.error({ error }, "Error triggering task.");
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
