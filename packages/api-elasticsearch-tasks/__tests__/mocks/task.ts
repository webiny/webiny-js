import { createMockIdentity } from "./identity";
import { ITask, TaskDataStatus } from "@webiny/tasks/types";

export const createTaskMock = (task?: Partial<ITask>): ITask => {
    return {
        id: "myCustomTaskDataId",
        definitionId: "myCustomTaskDefinition",
        input: {},
        name: "A custom task defined via method",
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        taskStatus: TaskDataStatus.PENDING,
        createdBy: createMockIdentity(),
        eventResponse: undefined,
        executionName: "mycustomexecutionname",
        iterations: 0,
        ...task
    };
};
