import { ITaskData, TaskDataStatus } from "~/types";

export const createMockTask = (task?: Partial<ITaskData>): ITaskData => {
    return {
        id: "myCustomTaskDataId",
        definitionId: "myCustomTaskDefinition",
        input: {},
        name: "A custom task defined via method",
        log: [],
        createdOn: new Date(),
        savedOn: new Date(),
        status: TaskDataStatus.PENDING,
        ...task
    };
};
