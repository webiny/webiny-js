import { vi } from "vitest";
import type { SchedulerClient } from "@webiny/aws-sdk/client-scheduler";

export const createMockScheduleClient = (send = vi.fn()): Pick<SchedulerClient, "send"> => {
    return {
        send: send || vi.fn()
    };
};
