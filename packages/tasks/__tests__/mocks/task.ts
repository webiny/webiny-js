import { ITaskData, TaskDataStatus } from "~/types";
import { createMockIdentity } from "./identity";

export const createMockTask = (task?: Partial<ITaskData>): ITaskData => {
    return {
        id: "myCustomTaskDataId",
        definitionId: "myCustomTaskDefinition",
        values: {},
        name: "A custom task defined via method",
        log: [],
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        status: TaskDataStatus.PENDING,
        createdBy: createMockIdentity(),
        eventResponse: {},
        ...task
    };
};
