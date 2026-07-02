import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";

/** @deprecated getClient is now passed to registerSchedulerAwsExtension in @webiny/api-scheduler-aws */
export interface ISchedulerFeatureConfig {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}
