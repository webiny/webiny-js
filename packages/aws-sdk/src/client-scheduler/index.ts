import { createCacheKey } from "@webiny/utils";
import type { SchedulerClientConfig as BaseSchedulerClientConfig } from "@aws-sdk/client-scheduler";
import { SchedulerClient } from "@aws-sdk/client-scheduler";

export {
    SchedulerClient,
    GetScheduleCommand,
    CreateScheduleCommand,
    UpdateScheduleCommand,
    DeleteScheduleCommand
} from "@aws-sdk/client-scheduler";

export type {
    GetScheduleCommandInput,
    GetScheduleCommandOutput,
    CreateScheduleCommandInput,
    CreateScheduleCommandOutput,
    UpdateScheduleCommandInput,
    UpdateScheduleCommandOutput,
    DeleteScheduleCommandInput,
    DeleteScheduleCommandOutput
} from "@aws-sdk/client-scheduler";

const clients: Record<string, SchedulerClient> = {};

export interface SchedulerClientConfig extends BaseSchedulerClientConfig {
    cache?: boolean;
}

export const createSchedulerClient = (
    input: Partial<SchedulerClientConfig> = {}
): SchedulerClient => {
    const options: SchedulerClientConfig = {
        region: process.env.AWS_REGION,
        ...input
    };

    const skipCache = options.cache === false;
    delete options.cache;
    if (skipCache) {
        return new SchedulerClient(options);
    }

    const key = createCacheKey(options);

    if (clients[key]) {
        return clients[key];
    }

    const client = new SchedulerClient(options);

    clients[key] = client;

    return client;
};
