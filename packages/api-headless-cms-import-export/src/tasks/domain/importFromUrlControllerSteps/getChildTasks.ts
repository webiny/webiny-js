import { ITask, TaskDataStatus } from "@webiny/tasks";
import { Context } from "~/types";

export interface IGetChildTasksParams {
    context: Context;
    task: ITask;
    definition: string;
}

export const getChildTasks = async ({ context, task, definition }: IGetChildTasksParams) => {
    const running: string[] = [];
    const done: string[] = [];
    const invalid: string[] = [];
    const aborted: string[] = [];
    const failed: string[] = [];
    const collection: string[] = [];

    const { items: tasks } = await context.tasks.listTasks({
        where: {
            parentId: task.id,
            definitionId: definition
        }
    });
    for (const task of tasks) {
        collection.push(task.id);
        if (
            task.taskStatus === TaskDataStatus.RUNNING ||
            task.taskStatus === TaskDataStatus.PENDING
        ) {
            running.push(task.id);
            continue;
        } else if (task.taskStatus === TaskDataStatus.SUCCESS) {
            done.push(task.id);
            continue;
        } else if (task.taskStatus === TaskDataStatus.FAILED) {
            failed.push(task.id);
            continue;
        } else if (task.taskStatus === TaskDataStatus.ABORTED) {
            aborted.push(task.id);
            continue;
        }
        /**
         * Impossible to be in a state not listed above, but just in case.
         */
        invalid.push(task.id);
    }
    return {
        running,
        done,
        invalid,
        aborted,
        failed,
        collection
    };
};
