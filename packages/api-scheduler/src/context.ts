import { ContextPlugin } from "@webiny/api";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { SchedulePrivateModel } from "~/domain/SchedulePrivateModel.js";
import { SchedulerFeature } from "~/features/SchedulerFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { SchedulerGraphQLFactory } from "~/graphql/index.js";
import { SchedulerPermissionsFeature } from "~/features/permissions/feature.js";
import { NamespaceHandlerExecutioner } from "~/features/NamespaceHandler/NamespaceHandlerExecutioner.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

export const createSchedulerContext = () => {
    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(SchedulePrivateModel);
    });

    const schedulerContextPlugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
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

    return [modelsPlugin, schedulerContextPlugin];
};
