import { TaskManagerStore } from "@webiny/tasks/runner/TaskManagerStore";
import { Context, ITask, ITaskLog } from "@webiny/tasks/types";
import { createTaskMock } from "~tests/mocks/task";
import { createContextMock } from "~tests/mocks/context";
import { createTaskLogMock } from "~tests/mocks/log";

interface Params {
    context?: Context;
    task?: ITask;
    log?: ITaskLog;
}
export const createTaskManagerStoreMock = (params?: Params) => {
    const context = params?.context || createContextMock();
    const task = params?.task || createTaskMock();
    const log = params?.log || createTaskLogMock(task);
    return new TaskManagerStore(context, task, log);
};
