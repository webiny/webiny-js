import { ITask, ITaskLog } from "@webiny/tasks";
import { createMockIdentity } from "~tests/mocks/identity";

export const createTaskLogMock = (task: Pick<ITask, "id">): ITaskLog => {
    return {
        id: "acustomtasklogid",
        createdOn: new Date().toISOString(),
        createdBy: createMockIdentity(),
        executionName: "acustomexecutionname",
        task: task.id,
        iteration: 1,
        items: []
    };
};
