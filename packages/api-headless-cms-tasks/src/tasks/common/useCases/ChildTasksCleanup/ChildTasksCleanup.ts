import { ITask, Context, ITaskLogItemType } from "@webiny/tasks";
import { IUseCase } from "~/tasks/IUseCase";

export interface IChildTasksCleanupExecuteParams {
    context: Context;
    task: ITask;
}

/**
 * Cleanup of the child tasks.
 * This code will remove all the child tasks and their logs, which have no errors in them.
 */
export class ChildTasksCleanup implements IUseCase<IChildTasksCleanupExecuteParams, void> {
    public async execute(params: IChildTasksCleanupExecuteParams): Promise<void> {
        const { context, task } = params;

        const { items: childTasks } = await context.tasks.listTasks({
            where: {
                parentId: task.id
            },
            // Really doubtful there will be more than 10k of child tasks.
            limit: 10000
        });

        if (childTasks.length === 0) {
            return;
        }

        const childTaskIdList = childTasks.map(childTask => childTask.id);

        const { items: childLogs } = await context.tasks.listLogs({
            where: {
                task_in: childTaskIdList
            },
            limit: 10000
        });

        const deletedChildTaskLogIdList: string[] = [];
        /**
         * First, we need to remove all the logs which have no errors.
         */
        for (const log of childLogs) {
            if (log.items.some(item => item.type === ITaskLogItemType.ERROR)) {
                continue;
            }
            await context.tasks.deleteLog(log.id);
            if (deletedChildTaskLogIdList.includes(log.task)) {
                continue;
            }
            deletedChildTaskLogIdList.push(log.task);
        }
        /**
         * Now we can remove the tasks.
         */
        for (const childTaskId of deletedChildTaskLogIdList) {
            await context.tasks.deleteTask(childTaskId);
        }
    }
}
