import { createImplementation } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import { ScopeTenant as Abstraction } from "./abstractions.js";
import { NoScopeTenantError, assertScopeTenant } from "./errors.js";

class ScopeTenantImpl implements Abstraction.Interface {
    constructor(private tenantContext: TenantContext.Interface) {}

    getId(...passed: Abstraction.Passed[]): string {
        const tenant = this.tenantContext.getTenant();
        if (!tenant) {
            throw new NoScopeTenantError();
        }
        assertScopeTenant(tenant.id, passed);
        return tenant.id;
    }
}

export const ScopeTenant = createImplementation({
    abstraction: Abstraction,
    implementation: ScopeTenantImpl,
    dependencies: [TenantContext]
});
