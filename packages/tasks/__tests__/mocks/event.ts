import { ITaskEvent } from "~/handler/types";

export const createMockEvent = (event?: Partial<ITaskEvent>): ITaskEvent => {
    return {
        webinyTaskId: "mockEventId",
        tenant: "root",
        locale: "en-US",
        endpoint: "manage",
        stateMachineId: "randomMachineId",
        ...event
    };
};
