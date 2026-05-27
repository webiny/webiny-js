import type { ITaskEvent } from "~/api/handler/types";
import { MOCK_TASK_DEFINITION_ID } from "~tests/mocks/definition";

export const createMockEvent = (event?: Partial<ITaskEvent>): ITaskEvent => {
    return {
        webinyTaskId: "mockEventId",
        tenant: "root",
        endpoint: "manage",
        stateMachineId: "randomMachineId",
        webinyTaskDefinitionId: MOCK_TASK_DEFINITION_ID,
        executionName: "executionNameMock",
        ...event
    };
};
