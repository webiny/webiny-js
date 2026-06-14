import { ContextPlugin } from "@webiny/api";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SCHEDULE_MODEL_ID } from "@webiny/api-scheduler/constants.js";
import {
    ScheduledActionModel,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
import { TimerSchedulerService } from "~/TimerSchedulerService.js";
import { SchedulePrivateModel } from "@webiny/api-scheduler/domain/SchedulePrivateModel.js";
import { SchedulerFeature } from "@webiny/api-scheduler/features/SchedulerFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { SchedulerGraphQLFactory } from "@webiny/api-scheduler/graphql/index.js";
import { SchedulerPermissionsFeature } from "@webiny/api-scheduler/features/permissions/feature.js";
import { NamespaceHandlerExecutioner } from "@webiny/api-scheduler/features/NamespaceHandler/NamespaceHandlerExecutioner.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
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

        const service = new TimerSchedulerService({
            onTrigger: async (id, namespace) => {
                const executeUseCase = context.container.resolve(ExecuteScheduledActionUseCase);
                const result = await executeUseCase.execute({
                    id,
                    namespace
                });

                if (result.isFail()) {
                    console.error(
                        `Scheduled action "${id}" execution failed:`,
                        result.error.message
                    );
                }
            }
        });

        context.container.registerInstance(SchedulerService, service);

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
