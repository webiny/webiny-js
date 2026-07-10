import type { Container } from "@webiny/di";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";

/**
 * Registers the self-hosted (Bree, in-process) scheduler transport. Binds `SchedulerService`
 * per-request via a RequestContextInitializer (post-tenant): builds the Bree service, wires the
 * trigger to ExecuteScheduledActionUseCase, and starts it with the tenant's pending actions.
 */
export const registerSchedulerServerExtension = (container: Container) => {
    container.registerInstance(RequestContextInitializer, {
        async init(ctx: Record<string, any>) {
            const requestContainer = ctx.container as Container;
            const tenantContext = requestContainer.resolve(TenantContext);

            const tenant = tenantContext.getTenant();
            if (!tenant) {
                return;
            }

            const logger = requestContainer.resolve(Logger);
            const executeScheduledAction = requestContainer.resolve(ExecuteScheduledActionUseCase);

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

            requestContainer.registerInstance(SchedulerService, service);

            const listScheduledActions = requestContainer.resolve(ListScheduledActionsUseCase);
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
        }
    });
};
