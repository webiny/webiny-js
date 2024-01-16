import { ITaskEvent } from "@webiny/tasks/handler/types";

export const createMockEvent = (event?: Partial<ITaskEvent>): ITaskEvent => {
    return {
        webinyTaskId: "mockEventId",
        webinyTaskDefinitionId: "mockDefinitionId",
        executionName: "someExecutionName",
        tenant: "root",
        locale: "en-US",
        endpoint: "manage",
        stateMachineId: "randomMachineId",
        ...event
    };
};
