import { SchedulerClient } from "@webiny/aws-sdk/client-scheduler";

export const createMockScheduleClient = (send = jest.fn()): Pick<SchedulerClient, "send"> => {
    return {
        send: send || jest.fn()
    };
};
