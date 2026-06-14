import { ContextPlugin } from "@webiny/api";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SCHEDULE_MODEL_ID } from "@webiny/api-scheduler/constants.js";
import {
    ScheduledActionModel,
    SchedulerService
} from "@webiny/api-scheduler/shared/abstractions.js";
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
import { BreeSchedulerService } from "~/BreeSchedulerService.js";

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

        const executeScheduledAction = context.container.resolve(ExecuteScheduledActionUseCase);

        const service = new BreeSchedulerService({
            onTrigger: async (id, namespace) => {
                const result = await executeScheduledAction.execute({ id, namespace });

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

        /* Start bree and recover pending actions from DB. */
        await service.start();

        const listScheduledActions = context.container.resolve(ListScheduledActionsUseCase);
        const listResult = await listScheduledActions.execute({
            where: {},
            limit: 1000
        });

        if (listResult.isOk() && listResult.value.items.length > 0) {
            const pendingActions = listResult.value.items.map(action => ({
                id: action.id,
                namespace: action.namespace,
                scheduledFor: action.scheduledFor
            }));

            await service.recover(pendingActions);
        }
    });

    return [schedulerContextPlugin, modelsPlugin];
};
