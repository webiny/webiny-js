import { ITaskData, ITaskLog } from "~/types";
import { createMockIdentity } from "~tests/mocks/identity";

export const createMockTaskLog = (
    task: Pick<ITaskData, "id">,
    input?: Partial<ITaskLog>
): ITaskLog => {
    return {
        id: "mock-task-log-id",
        task: task.id,
        iteration: 1,
        executionName: "mock-execution-name",
        createdOn: new Date().toISOString(),
        createdBy: createMockIdentity(),
        items: [],
        ...input
    };
};
