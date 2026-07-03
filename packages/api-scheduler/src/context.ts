import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SCHEDULE_MODEL_ID } from "~/constants.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { SchedulePrivateModel } from "~/domain/SchedulePrivateModel.js";
import { SchedulerFeature } from "~/features/SchedulerFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { SchedulerPermissionsFeature } from "~/features/permissions/feature.js";
import { ContextPlugin } from "@webiny/api";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { NamespaceHandlerExecutionerFeature } from "~/features/NamespaceHandler/feature.js";
import { SchedulerGraphQLFactoryFeature } from "~/graphql/feature.js";

export const registerSchedulerExtension = () => {
    const extensionPlugin = createRegisterExtensionPlugin(async context => {
        context.container.register(SchedulePrivateModel);
        SchedulerPermissionsFeature.register(context.container);
        SchedulerGraphQLFactoryFeature.register(context.container);
        NamespaceHandlerExecutionerFeature.register(context.container);
        SchedulerFeature.register(context.container);
    });
    extensionPlugin.name = "scheduler.base.extension";

    const contextPlugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        await context.container.resolve(IdentityContext).withoutAuthorization(async () => {
            const schedulerModel = await getModel.execute(SCHEDULE_MODEL_ID);
            if (schedulerModel.isFail()) {
                throw schedulerModel.error;
            }
            context.container.registerInstance(ScheduledActionModel, schedulerModel.value);
        });
    });

    contextPlugin.name = "scheduler.base.context";

    return [extensionPlugin, contextPlugin];
};
