import { ITaskEvent } from "~/handler/types";
import { MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";

export const createMockEvent = (event?: Partial<ITaskEvent>): ITaskEvent => {
    return {
        webinyTaskId: "mockEventId",
        tenant: "root",
        locale: "en-US",
        endpoint: "manage",
        stateMachineId: "randomMachineId",
        webinyTaskDefinitionId: MOCK_TASK_DEFINITION_ID,
        executionName: "executionNameMock",
        ...event
    };
};
