import { ContextPlugin } from "@webiny/api";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { createSchedulerContext } from "@webiny/api-scheduler/context.js";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";

export const createServerSchedulerContext = () => {
    const servicePlugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);

        if (!tenantContext.getTenant()) {
            return;
        }

        const logger = context.container.resolve(Logger);
        const executeScheduledAction = context.container.resolve(ExecuteScheduledActionUseCase);

        const service = new BreeSchedulerService({
            logger,
            onTrigger: async (id, namespace) => {
                const result = await executeScheduledAction.execute({ id, namespace });

                if (result.isFail()) {
                    logger.error(
                        `Scheduled action "${id}" execution failed: ${result.error.message}`
                    );
                }
            }
        });

        context.container.registerInstance(SchedulerService, service);
    });

    const postInitPlugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);

        if (!tenantContext.getTenant()) {
            return;
        }

        const service = context.container.resolve(SchedulerService) as BreeSchedulerService;

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

    return [servicePlugin, createSchedulerContext, postInitPlugin];
};
