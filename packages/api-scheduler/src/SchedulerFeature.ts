import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { createSchedulerContext } from "./context.js";
import { SchedulePrivateModel } from "./domain/SchedulePrivateModel.js";

export interface ISchedulerFeatureConfig {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container: Container, config: ISchedulerFeatureConfig) {
        container.register(SchedulePrivateModel);
        registerLegacyPluginsViaGqlContextEnhancer(container, [
            ...createSchedulerContext({ getClient: config.getClient })
        ]);
    }
});
