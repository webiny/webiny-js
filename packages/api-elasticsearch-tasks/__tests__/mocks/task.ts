import { createMockIdentity } from "./identity";
import { ITaskData, TaskDataStatus } from "@webiny/tasks/types";

export const createTaskMock = (task?: Partial<ITaskData>): ITaskData => {
    return {
        id: "myCustomTaskDataId",
        definitionId: "myCustomTaskDefinition",
        input: {},
        name: "A custom task defined via method",
        log: [],
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        taskStatus: TaskDataStatus.PENDING,
        createdBy: createMockIdentity(),
        eventResponse: undefined,
        ...task
    };
};
