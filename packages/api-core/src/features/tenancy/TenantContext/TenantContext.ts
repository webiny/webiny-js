import { createImplementation } from "@webiny/feature/api";
import { KernelExecution } from "@webiny/api-kernel-core";
import { TenantContext as Abstraction } from "./abstractions.js";
import type { Tenant } from "~/types/tenancy.js";
import { TenantAlreadySetError, assertTenantEnabled } from "./errors.js";

/**
 * The tenant of a tenant scope's container. Every service of the container is built for that
 * tenant; work in another tenant runs in that tenant's scope (`TenantScopes.withTenant()`).
 */
class TenantContextImpl implements Abstraction.Interface {
    private currentTenant: Tenant | null = null;

    constructor(private kernelExecution: KernelExecution.Interface | undefined) {}

    getTenant(): Tenant {
        this.kernelExecution?.assertCurrent("TenantContext");
        return this.currentTenant!;
    }

    /*
     * Sets the container's tenant, once. Every service of the container was built for that tenant,
     * so switching to another one would leave them acting on the first. Setting the same tenant
     * again refreshes its record: the system install replaces the bootstrap root with the real one.
     */
    setTenant(tenant: Tenant): void {
        this.kernelExecution?.assertCurrent("TenantContext");
        assertTenantEnabled(tenant);

        if (this.currentTenant && this.currentTenant.id !== tenant.id) {
            throw new TenantAlreadySetError(this.currentTenant.id, tenant.id);
        }
        this.currentTenant = tenant;
    }
}

export const TenantContext = createImplementation({
    abstraction: Abstraction,
    implementation: TenantContextImpl,
    dependencies: [[KernelExecution, { optional: true }]]
});
