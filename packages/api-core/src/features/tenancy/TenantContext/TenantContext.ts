import { AsyncLocalStorage } from "node:async_hooks";
import { createImplementation } from "@webiny/feature/api";
import { HandlerExecution } from "@webiny/event-handler-core";
import { TenantContext as Abstraction } from "./abstractions.js";
import type { Tenant } from "~/types/tenancy.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { TenantIsDisabledError } from "./errors.js";

/** The tenant a `with*` call switched to, for the code inside its callback. */
interface TenantOverride {
    tenant: Tenant;
}

function assertTenantEnabled(tenant: Tenant): void {
    if (tenant.isInstalled && tenant.status === "disabled") {
        throw new TenantIsDisabledError();
    }
}

class TenantContextImpl implements Abstraction.Interface {
    private currentTenant: Tenant | null = null;
    /*
     * The `with*` methods switch the tenant for their callback's async call chain only. Before, they
     * set `currentTenant` and restored it afterwards, so any other code of the same request running
     * meanwhile (a sibling GraphQL field, a `Promise.all` branch) read the switched tenant too.
     */
    private readonly overrides = new AsyncLocalStorage<TenantOverride>();

    constructor(
        private getRootTenant: GetRootTenantUseCase.Interface,
        private handlerExecution: HandlerExecution.Interface | undefined
    ) {}

    getTenant(): Tenant {
        this.handlerExecution?.assertCurrent("TenantContext");
        const override = this.overrides.getStore();
        if (override) {
            return override.tenant;
        }
        return this.currentTenant!;
    }

    /*
     * Inside a `with*` callback this switches the callback's tenant, which ends with the callback, as
     * it did before. Outside one it sets the request's tenant.
     */
    setTenant(tenant: Tenant): void {
        this.handlerExecution?.assertCurrent("TenantContext");
        assertTenantEnabled(tenant);

        const override = this.overrides.getStore();
        if (override) {
            override.tenant = tenant;
            return;
        }
        this.currentTenant = tenant;
    }

    async withRootTenant<T>(cb: () => T): Promise<T> {
        const rootTenant = await this.getRootTenant.execute();
        if (!rootTenant.isOk()) {
            return rootTenant.error as T;
        }

        return this.runAs(rootTenant.value, async () => cb());
    }

    async withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        const results = [];
        for (const tenant of tenants) {
            const result = await this.runAs(tenant, () => cb(tenant));
            results.push(result);
        }
        return results;
    }

    async withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        return this.runAs(tenant, () => cb(tenant));
    }

    private runAs<TReturn>(tenant: Tenant, cb: () => Promise<TReturn>): Promise<TReturn> {
        this.handlerExecution?.assertCurrent("TenantContext");
        assertTenantEnabled(tenant);

        const override: TenantOverride = { tenant };
        return this.overrides.run(override, cb);
    }
}

export const TenantContext = createImplementation({
    abstraction: Abstraction,
    implementation: TenantContextImpl,
    dependencies: [GetRootTenantUseCase, [HandlerExecution, { optional: true }]]
});
