import { Context } from "~tests/types";
import { ITaskCreateData, ITaskUpdateData } from "~/types";

export interface CreateLiveTaskParams<C extends Context = Context> {
    context: C;
    data: ITaskCreateData & Partial<ITaskUpdateData>;
    taskLog?: boolean;
}

export const createLiveTask = async <C extends Context = Context>(
    params: CreateLiveTaskParams<C>
) => {
    const { context, data } = params;
    const task = await context.tasks.createTask(data);
    if (params.taskLog) {
        return {
            task
        };
    }
    const taskLog = await context.tasks.createLog(task, {
        iteration: 1,
        executionName: task.executionName || data.executionName || "unknownExecutionName"
    });

    return {
        task,
        taskLog
    };
};
