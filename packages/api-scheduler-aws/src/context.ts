import { ContextPlugin } from "@webiny/api";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { getManifest } from "~/manifest.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { EventBridgeSchedulerService } from "~/features/SchedulerService/EventBridgeSchedulerService.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { createSchedulerContext } from "@webiny/api-scheduler/context.js";

export interface ICreateSchedulerContextParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const createAwsSchedulerContext = (params: ICreateSchedulerContextParams) => {
    const servicePlugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);

        if (!tenantContext.getTenant()) {
            return;
        }

        const manifest = await getManifest();

        if (manifest.error) {
            context.container.registerInstance(SchedulerService, new VoidSchedulerService());
        } else {
            context.container.registerInstance(
                SchedulerService,
                new EventBridgeSchedulerService(params.getClient, {
                    lambdaArn: manifest.data.lambdaArn,
                    roleArn: manifest.data.roleArn
                })
            );
        }
    });

    return [servicePlugin, createSchedulerContext];
};
