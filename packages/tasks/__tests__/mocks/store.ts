import { TaskManagerStore, TaskManagerStoreContext } from "~/runner/TaskManagerStore";
import { ITask, ITaskDataInput, ITaskLog } from "~/types";
import { createMockContext } from "./context";
import { createMockTask } from "./task";
import { createMockTaskLog } from "./taskLog";

interface Params {
    context?: TaskManagerStoreContext;
    task?: ITask<ITaskDataInput>;
    taskLog?: ITaskLog;
}

export const createMockTaskManagerStore = (params?: Params) => {
    const task = params?.task || createMockTask();
    return new TaskManagerStore(
        params?.context || createMockContext(),
        task,
        params?.taskLog || createMockTaskLog(task)
    );
};
