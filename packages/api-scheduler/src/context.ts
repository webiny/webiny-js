import { ContextPlugin } from "@webiny/api";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { getManifest } from "~/manifest.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SCHEDULE_MODEL_ID } from "./constants.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import { EventBridgeSchedulerService } from "~/features/SchedulerService/EventBridgeSchedulerService.js";
import { VoidSchedulerService } from "~/features/SchedulerService/VoidSchedulerService.js";
import { createSchedulerModel } from "~/domain/model.js";
import { SchedulerFeature } from "./features/SchedulerFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface ICreateHeadlessCmsSchedulerContextParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const createSchedulerContext = (params: ICreateHeadlessCmsSchedulerContextParams) => {
    return new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const identityContext = context.container.resolve(IdentityContext);

        if (!tenantContext.getTenant()) {
            return;
        }

        const manifest = await getManifest({
            client: context.db.driver.getClient() as DynamoDBDocument
        });

        if (manifest.error) {
            context.container.registerInstance(SchedulerService, new VoidSchedulerService());
        } else {
            // TODO: in the future, extract AWS specific implementation into a separate package
            context.container.registerInstance(
                SchedulerService,
                new EventBridgeSchedulerService(params.getClient, {
                    lambdaArn: manifest.data.lambdaArn,
                    roleArn: manifest.data.roleArn
                })
            );
        }

        context.plugins.register(createSchedulerModel());
        const schedulerModel = await identityContext.withoutAuthorization(() => {
            return context.cms.getModel(SCHEDULE_MODEL_ID);
        });

        // Register model via a dedicated abstraction
        context.container.registerInstance(ScheduledActionModel, schedulerModel);

        // Register all features
        SchedulerFeature.register(context.container);
    });
};
