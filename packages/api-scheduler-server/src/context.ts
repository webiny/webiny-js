import type { Container } from "@webiny/di";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import type { IRequestContextInitializer } from "@webiny/event-handler-core";
import { SchedulerService } from "@webiny/api-scheduler/shared/abstractions.js";
import { ExecuteScheduledActionUseCase } from "@webiny/api-scheduler/features/ExecuteScheduledAction/index.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { BreeSchedulerService } from "~/BreeSchedulerService.js";

/**
 * Per-request scheduler initializer for the self-hosted (Bree, in-process) transport. Builds the Bree
 * service, wires the trigger to ExecuteScheduledActionUseCase, binds `SchedulerService`, and starts it
 * with the tenant's pending actions.
 *
 * IMPORTANT — this MUST be registered via `container.register()` (not `registerInstance()`), and hence
 * runs in the LATER RequestContextInitializer bucket. Its `init()` lists scheduled actions, which needs
 * `ScheduledActionModel` — and that model is registered by another RequestContextInitializer
 * (`SchedulerModelContextualSchema`, registered by `SchedulerFeature` via `register()`). `@webiny/di`
 * runs `registerInstance` initializers BEFORE `register` ones, so a `registerInstance` here would run
 * before the model exists → "No registration found for ScheduledActionModel". Registering as an
 * implementation keeps both in the same (register) bucket, ordered by registration: `SchedulerFeature`
 * (which registers the model initializer) is registered before this transport hook, so the model is
 * always available by the time this runs.
 */
class SchedulerServerContextInitializerImpl implements IRequestContextInitializer {
    async init(ctx: Record<string, any>): Promise<void> {
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
}

const SchedulerServerContextInitializer = RequestContextInitializer.createImplementation({
    implementation: SchedulerServerContextInitializerImpl,
    dependencies: []
});

/**
 * Registers the self-hosted (Bree, in-process) scheduler transport. Binds `SchedulerService`
 * per-request via a RequestContextInitializer (post-tenant) — see the class doc for the ordering
 * constraint that requires `register()` over `registerInstance()`.
 */
export const registerSchedulerServerExtension = (container: Container) => {
    container.register(SchedulerServerContextInitializer);
};
