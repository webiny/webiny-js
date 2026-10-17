import { ListTenantsUseCase } from "@webiny/api-core/features/tenancy/ListTenants/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { ListScheduledActionsUseCase } from "@webiny/api-scheduler/features/ListScheduledActions/index.js";
import { ScheduledActionRecoverEventHandler } from "./ScheduledActionRecoverEventHandler.js";
import type { IPendingAction } from "@webiny/api-scheduler-standalone";
import { SchedulerSingleton } from "./abstractions/SchedulerSingleton.js";

// Pending actions read per page.
const PAGE_SIZE = 1000;

/*
 * A tenant that isn't installed has no scheduler model to read, and a disabled one must not run its
 * schedules. Both are left alone; a disabled tenant's schedules come back on the next restart after
 * it is re-enabled.
 */
function canRecover(tenant: Tenant): boolean {
    return tenant.isInstalled && tenant.status !== "disabled";
}

/**
 * Re-arms every tenant's pending scheduled actions in the Bree singleton. Bree keeps its timers in
 * memory, so a restart loses them all. Overdue actions run at once (see
 * `BreeSchedulerService.recover`).
 *
 * Each tenant is recovered on its own: one that fails is logged and reported in the result, and the
 * rest are still recovered. A fresh install has no tenants yet and recovers nothing.
 */
class RecoverScheduledActionsHandlerImpl implements ScheduledActionRecoverEventHandler.Interface {
    public constructor(
        private readonly listTenants: ListTenantsUseCase.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly listScheduledActions: ListScheduledActionsUseCase.Interface,
        private readonly scheduler: SchedulerSingleton.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async execute(): Promise<ScheduledActionRecoverEventHandler.Result> {
        // A failed lookup is not a fresh install: it throws, so the boot step reports it.
        const tenantsResult = await this.listTenants.execute();
        if (tenantsResult.isFail()) {
            throw tenantsResult.error;
        }

        let recovered = 0;
        const failedTenants: string[] = [];

        for (const tenant of tenantsResult.value) {
            if (!canRecover(tenant)) {
                continue;
            }
            try {
                recovered += await this.recoverTenant(tenant);
            } catch (error) {
                failedTenants.push(tenant.id);
                this.logger.error(
                    { error, tenant: tenant.id },
                    "Could not recover the tenant's scheduled actions."
                );
            }
        }

        return { recovered, failedTenants };
    }

    private recoverTenant(tenant: Tenant): Promise<number> {
        return this.tenantContext.withTenant(tenant, () => {
            /*
             * Nobody is signed in at boot. Listing without authorization is what the run side does
             * too (ExecuteScheduledActionUseCase); otherwise the anonymous identity fails the
             * permission check.
             */
            return this.identityContext.withoutAuthorization(() => {
                return this.recoverAllPending(tenant.id);
            });
        });
    }

    /*
     * Re-arms page by page, so a lookup that fails on a later page still leaves the earlier pages
     * armed. The failure is rethrown and logged by the boot step.
     */
    private async recoverAllPending(tenant: string): Promise<number> {
        let recovered = 0;
        let after: string | undefined;

        do {
            const listResult = await this.listScheduledActions.execute({
                where: {},
                limit: PAGE_SIZE,
                after
            });
            if (listResult.isFail()) {
                throw listResult.error;
            }

            const page: IPendingAction[] = [];
            for (const action of listResult.value.items) {
                page.push({
                    id: action.id,
                    namespace: action.namespace,
                    tenant,
                    scheduledFor: action.scheduledFor
                });
            }

            await this.scheduler.recover(page);
            recovered += page.length;

            const { meta } = listResult.value;
            after = meta.hasMoreItems && meta.cursor ? meta.cursor : undefined;
        } while (after);

        return recovered;
    }
}

export const RecoverScheduledActionsHandler =
    ScheduledActionRecoverEventHandler.createImplementation({
        implementation: RecoverScheduledActionsHandlerImpl,
        dependencies: [
            ListTenantsUseCase,
            TenantContext,
            IdentityContext,
            ListScheduledActionsUseCase,
            SchedulerSingleton,
            Logger
        ]
    });
