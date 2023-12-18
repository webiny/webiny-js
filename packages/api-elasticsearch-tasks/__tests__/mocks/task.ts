import { createMockIdentity } from "./identity";
import { ITaskData, TaskDataStatus } from "@webiny/tasks/types";

export const createTaskMock = (task?: Partial<ITaskData>): ITaskData => {
    return {
        id: "myCustomTaskDataId",
        definitionId: "myCustomTaskDefinition",
        values: {},
        name: "A custom task defined via method",
        log: [],
        createdOn: new Date(),
        savedOn: new Date(),
        status: TaskDataStatus.PENDING,
        createdBy: createMockIdentity(),
        eventResponse: {},
        ...task
    };
};
