import { ContextPlugin } from "@webiny/api";
import type {
    SchedulerClient,
    SchedulerClientConfig
} from "@webiny/aws-sdk/client-scheduler/index.js";
import { getManifest } from "~/manifest.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SCHEDULE_MODEL_ID } from "@webiny/api-scheduler/constants.js";
import {
    ScheduledActionModel,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
import { EventBridgeSchedulerService } from "~/features/SchedulerService/EventBridgeSchedulerService.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { SchedulePrivateModel } from "@webiny/api-scheduler/domain/SchedulePrivateModel.js";
import { SchedulerFeature } from "@webiny/api-scheduler/features/SchedulerFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { SchedulerGraphQLFactory } from "@webiny/api-scheduler/graphql/index.js";
import { SchedulerPermissionsFeature } from "@webiny/api-scheduler/features/permissions/feature.js";
import { NamespaceHandlerExecutioner } from "@webiny/api-scheduler/features/NamespaceHandler/NamespaceHandlerExecutioner.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

export interface ICreateSchedulerContextParams {
    getClient(config?: SchedulerClientConfig): Pick<SchedulerClient, "send">;
}

export const createSchedulerContext = (params: ICreateSchedulerContextParams) => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(SchedulePrivateModel);
    });

    const schedulerContextPlugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

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

        SchedulerPermissionsFeature.register(context.container);
        context.container.register(SchedulerGraphQLFactory);
        context.container.register(NamespaceHandlerExecutioner);

        await context.security.withoutAuthorization(async () => {
            const schedulerModel = await getModel.execute(SCHEDULE_MODEL_ID);
            context.container.registerInstance(ScheduledActionModel, schedulerModel.value);
        });

        SchedulerFeature.register(context.container);
    });

    return [schedulerContextPlugin, modelsPlugin];
};
