import { ContextPlugin } from "@webiny/api";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SCHEDULE_MODEL_ID } from "@webiny/api-scheduler/constants.js";
import {
    ScheduledActionModel,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { SchedulePrivateModel } from "@webiny/api-scheduler/domain/SchedulePrivateModel.js";
import { SchedulerFeature } from "@webiny/api-scheduler/features/SchedulerFeature.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { SchedulerGraphQLFactory } from "@webiny/api-scheduler/graphql/index.js";
import { SchedulerPermissionsFeature } from "@webiny/api-scheduler/features/permissions/feature.js";
import { NamespaceHandlerExecutioner } from "@webiny/api-scheduler/features/NamespaceHandler/NamespaceHandlerExecutioner.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { ScheduledActionPoller } from "~/ScheduledActionPoller.js";

export interface ICreateSchedulerContextParams {
    cronExpression?: string;
}

const DEFAULT_CRON_EXPRESSION = "* * * * *";

export const createSchedulerContext = (params?: ICreateSchedulerContextParams) => {
    const cronExpression = params?.cronExpression ?? DEFAULT_CRON_EXPRESSION;
    const poller = new ScheduledActionPoller();

    const modelsPlugin = createRegisterExtensionPlugin(context => {
        context.container.register(SchedulePrivateModel);
    });

    const schedulerContextPlugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);
        const getModel = context.container.resolve(GetModelUseCase);

        if (!tenantContext.getTenant()) {
            return;
        }

        /* The DB entry is the schedule; the poller is the trigger. */
        context.container.registerInstance(SchedulerService, new VoidSchedulerService());

        SchedulerPermissionsFeature.register(context.container);
        context.container.register(SchedulerGraphQLFactory);
        context.container.register(NamespaceHandlerExecutioner);

        await context.security.withoutAuthorization(async () => {
            const schedulerModel = await getModel.execute(SCHEDULE_MODEL_ID);
            context.container.registerInstance(ScheduledActionModel, schedulerModel.value);
        });

        SchedulerFeature.register(context.container);

        const listScheduledActions = context.container.resolve(ListScheduledActionsUseCase);
        const executeScheduledAction = context.container.resolve(ExecuteScheduledActionUseCase);

        await poller.start({
            cronExpression,
            listScheduledActions,
            executeScheduledAction
        });
    });

    return [schedulerContextPlugin, modelsPlugin];
};
