import { ITaskEvent } from "~/handler/types";

export const createMockEvent = (): ITaskEvent => {
    return {
        webinyTaskId: "webinyTaskId",
        tenant: "root",
        locale: "en-US",
        endpoint: "manage",
        stateMachineId: "randomMachineId"
    };
};
