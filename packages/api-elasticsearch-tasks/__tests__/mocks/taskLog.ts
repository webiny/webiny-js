import { ITaskLog } from "@webiny/tasks";
import { createMockIdentity } from "~tests/mocks/identity";

export const createTaskLogMock = (): ITaskLog => {
    return {
        id: "myCustomTaskLogId",
        task: "myCustomTaskDataId",
        items: [],
        createdOn: new Date().toISOString(),
        createdBy: createMockIdentity(),
        iteration: 0,
        executionName: "myCustomTaskExecution"
    };
};
