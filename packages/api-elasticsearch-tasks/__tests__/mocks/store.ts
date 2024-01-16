import { TaskManagerStore } from "@webiny/tasks/runner/TaskManagerStore";
import { Context, ITask } from "@webiny/tasks/types";
import { createTaskMock } from "~tests/mocks/task";
import { createContextMock } from "~tests/mocks/context";

interface Params {
    context?: Context;
    task?: ITask;
}
export const createTaskManagerStoreMock = (params?: Params) => {
    const context = params?.context || createContextMock();
    const task = params?.task || createTaskMock();
    return new TaskManagerStore(context, task);
};
