import { ITaskManagerStore } from "@webiny/tasks";
import { TaskCache } from "./TaskCache";
import { EntriesTask, HcmsTasksContext } from "~/types";

export class TaskTrigger<TInput, TStore> {
    private taskCache: TaskCache<TInput>;
    private readonly taskDefinition: EntriesTask;
    private readonly taskName: string;

    constructor(taskCache: TaskCache<any>, taskDefinition: EntriesTask, taskName: string) {
        this.taskCache = taskCache;
        this.taskDefinition = taskDefinition;
        this.taskName = taskName;
    }

    async execute(context: HcmsTasksContext, store: ITaskManagerStore<TStore>) {
        const tasks = this.taskCache.getTasks();
        if (tasks.length === 0) {
            return;
        }

        for (const task of tasks) {
            try {
                await context.tasks.trigger<TInput>({
                    definition: this.taskDefinition,
                    name: this.taskName,
                    parent: store.getTask(),
                    input: task
                });
            } catch (error) {
                console.error(`Error triggering task.`, error);
            }
        }

        // Clear the cache after processing
        this.taskCache.clear();
    }
}
