import type { DeleteTaskLogUseCase } from "@webiny/background-tasks/api";
import type { DeleteTaskUseCase } from "@webiny/background-tasks/api";
import type { ITask } from "@webiny/background-tasks/api";
import type { ListTaskLogsUseCase } from "@webiny/background-tasks/api";
import type { ListTasksUseCase } from "@webiny/background-tasks/api";
import { TaskLogItemType } from "@webiny/background-tasks/api";
import type { IUseCase } from "~/abstractions/index.js";

export interface IChildTasksCleanupExecuteParams {
    listTasks: ListTasksUseCase.Interface;
    listTaskLogs: ListTaskLogsUseCase.Interface;
    deleteTaskLog: DeleteTaskLogUseCase.Interface;
    deleteTask: DeleteTaskUseCase.Interface;
    task: ITask;
}

const deleteTasks = async (
    deleteTask: DeleteTaskUseCase.Interface,
    taskIds: string[]
): Promise<void> => {
    for (const taskId of taskIds) {
        const result = await deleteTask.execute(taskId);
        if (result.isFail()) {
            throw result.error;
        }
    }
};

/**
 * Cleanup of the child tasks.
 * This code will remove all the child tasks and their logs, which have no errors in them.
 */
export class ChildTasksCleanup implements IUseCase<IChildTasksCleanupExecuteParams, void> {
    public async execute(params: IChildTasksCleanupExecuteParams): Promise<void> {
        const { listTasks, listTaskLogs, deleteTaskLog, deleteTask, task } = params;

        const tasksResult = await listTasks.execute({
            where: {
                parentId: task.id
            },
            // Really doubtful there will be more than 10k of child tasks.
            limit: 10000
        });
        if (tasksResult.isFail()) {
            throw tasksResult.error;
        }
        const childTasks = tasksResult.value.items;

        if (childTasks.length === 0) {
            return;
        }

        const childTaskIdList = childTasks.map(childTask => childTask.id);

        const logsResult = await listTaskLogs.execute({
            where: {
                task_in: childTaskIdList
            },
            limit: 10000
        });
        if (logsResult.isFail()) {
            throw logsResult.error;
        }
        const childLogs = logsResult.value.items;

        /**
         * No logs found. Proceed with deleting the child tasks.
         */
        if (childLogs.length === 0) {
            await deleteTasks(deleteTask, childTaskIdList);
        }

        const deletedChildTaskLogIdList: string[] = [];
        /**
         * First, we need to remove all the logs which have no errors.
         */
        for (const log of childLogs) {
            if (log.items.some(item => item.type === TaskLogItemType.ERROR)) {
                continue;
            }
            const deleted = await deleteTaskLog.execute(log.id);
            if (deleted.isFail()) {
                throw deleted.error;
            }
            if (deletedChildTaskLogIdList.includes(log.task)) {
                continue;
            }
            deletedChildTaskLogIdList.push(log.task);
        }
        /**
         * Now we can remove the tasks.
         */
        await deleteTasks(deleteTask, deletedChildTaskLogIdList);
    }
}
