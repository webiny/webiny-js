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
import { SchedulePrivateModel } from "~/domain/SchedulePrivateModel.js";
import { SchedulerFeature } from "./features/SchedulerFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { SchedulerGraphQLFactory } from "~/graphql/index.js";
import { SchedulerPermissionsFeature } from "~/features/permissions/feature.js";
import { NamespaceHandlerExecutioner } from "~/features/NamespaceHandler/NamespaceHandlerExecutioner.js";

export interface ICreateSchedulerContextParams {
    /**
     * @deprecated Pass `schedulerService` directly. This path reads the
     * AWS scheduler manifest from DynamoDB and builds an
     * `EventBridgeSchedulerService` — i.e., the legacy serverless flow.
     * Container deployments supply `schedulerService` instead.
     */
    getClient?(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
    /**
     * Pre-built scheduler service. Container deployments supply a
     * `NodeSchedulerService` from `@webiny/api-scheduler-cron`. When set,
     * the manifest read + `EventBridgeSchedulerService` construction is
     * skipped entirely.
     */
    schedulerService?: SchedulerService.Interface;
}

export const createSchedulerContext = (params: ICreateSchedulerContextParams = {}) => {
    return new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        // Container path — caller injected a SchedulerService; skip the
        // manifest read entirely and use what was given.
        if (params.schedulerService) {
            context.container.registerInstance(SchedulerService, params.schedulerService);
        } else {
            // Legacy serverless path — read the AWS scheduler manifest from
            // DDB and construct an EventBridgeSchedulerService (or a
            // VoidSchedulerService if the manifest is missing).
            if (!params.getClient) {
                throw new Error(
                    "createScheduler: either `schedulerService` or `getClient` must be provided."
                );
            }

            const manifest = await getManifest({
                client: context.db.driver.getClient() as DynamoDBDocument
            });

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
        }

        SchedulerPermissionsFeature.register(context.container);
        context.container.register(SchedulePrivateModel);
        context.container.register(SchedulerGraphQLFactory);
        context.container.register(NamespaceHandlerExecutioner);

        await context.security.withoutAuthorization(async () => {
            const schedulerModel = await getModel.execute(SCHEDULE_MODEL_ID);
            context.container.registerInstance(ScheduledActionModel, schedulerModel.value);
        });

        // Register all features
        SchedulerFeature.register(context.container);
    });
};
