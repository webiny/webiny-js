import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { GetRootTenantUseCase } from "@webiny/api-core/features/tenancy/GetRootTenant/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import { ScheduledActionRecoverEventHandler } from "./ScheduledActionRecoverEventHandler.js";
import { SchedulerSingleton } from "./abstractions/SchedulerSingleton.js";

// The most pending actions one recovery reads.
const MAX_RECOVERED_ACTIONS = 1000;

/**
 * Re-arms the root tenant's pending scheduled actions in the Bree singleton. Overdue ones run at
 * once (see `BreeSchedulerService.recover`).
 *
 * Root tenant only. Recovering other tenants means enumerating them and recovering each; until
 * then a restart drops their pending schedules.
 */
class RecoverScheduledActionsHandlerImpl implements ScheduledActionRecoverEventHandler.Interface {
    public constructor(
        private readonly getRootTenant: GetRootTenantUseCase.Interface,
        private readonly rawTenantId: RawTenantId.Interface,
        private readonly tenantLoader: RequestTenantLoader.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly listScheduledActions: ListScheduledActionsUseCase.Interface,
        private readonly scheduler: SchedulerSingleton.Interface
    ) {}

    public async execute(): Promise<ScheduledActionRecoverEventHandler.Result> {
        const rootResult = await this.getRootTenant.execute();
        if (rootResult.isFail()) {
            // No root tenant yet: a fresh install has nothing to recover.
            return { recovered: 0 };
        }
        const tenant = rootResult.value.id;

        this.rawTenantId.set(tenant);
        await this.tenantLoader.establish();

        /*
         * Nobody is signed in at boot. Listing without authorization is what the run side does too
         * (ExecuteScheduledActionUseCase); otherwise the anonymous identity fails the permission check.
         */
        const listResult = await this.identityContext.withoutAuthorization(() => {
            return this.listScheduledActions.execute({ where: {}, limit: MAX_RECOVERED_ACTIONS });
        });
        if (listResult.isFail()) {
            throw listResult.error;
        }

        const pending = listResult.value.items.map(action => {
            return {
                id: action.id,
                namespace: action.namespace,
                tenant,
                scheduledFor: action.scheduledFor
            };
        });

        await this.scheduler.recover(pending);

        return { recovered: pending.length };
    }
}

export const RecoverScheduledActionsHandler =
    ScheduledActionRecoverEventHandler.createImplementation({
        implementation: RecoverScheduledActionsHandlerImpl,
        dependencies: [
            GetRootTenantUseCase,
            RawTenantId,
            RequestTenantLoader,
            IdentityContext,
            ListScheduledActionsUseCase,
            SchedulerSingleton
        ]
    });
