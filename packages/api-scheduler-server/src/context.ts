import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";
import { ContextPlugin } from "@webiny/api";

export const registerSchedulerServerExtension = () => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        const tenantContext = context.container.resolve(TenantContext);

        const tenant = tenantContext.getTenant();
        if (!tenant) {
            return;
        }

        const logger = context.container.resolve(Logger);
        const executeScheduledAction = context.container.resolve(ExecuteScheduledActionUseCase);

        const service = new BreeSchedulerService({
            logger,
            onTrigger: async (id, namespace) => {
                const result = await executeScheduledAction.execute({
                    id,
                    namespace,
                    tenant: tenant.id
                });

                if (result.isFail()) {
                    logger.error(
                        `Scheduled action "${id}" execution failed: ${result.error.message}`
                    );
                }
            }
        });

        context.container.registerInstance(SchedulerService, service);

        const listScheduledActions = context.container.resolve(ListScheduledActionsUseCase);
        const listResult = await listScheduledActions.execute({
            where: {},
            limit: 1000
        });

        const pendingActions = listResult.isOk()
            ? listResult.value.items.map(action => ({
                  id: action.id,
                  namespace: action.namespace,
                  scheduledFor: action.scheduledFor
              }))
            : undefined;

        await service.start(pendingActions);
    });

    plugin.name = "scheduler.server.extension";

    return plugin;
};
