import { LoginTenantResolver as Abstraction } from "./abstractions.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import type { Tenant } from "~/features/tenancy/abstractions.js";
import type { LogInError } from "~/features/security/LogIn/index.js";

const ROOT_TENANT = "root";

// The API couldn't load the tenant from the `x-tenant` header: it was deleted or disabled.
const UNAVAILABLE_TENANT_CODES = ["Tenancy/TenantNotFound", "Tenancy/TenantDisabled"];

class LoginTenantResolverImpl implements Abstraction.Interface {
    constructor(private tenantContext: TenantContext.Interface) {}

    async resolve(error: LogInError): Promise<Abstraction.Resolution> {
        if (error.code === "Security/Identity/TenantSelectionRequired") {
            const tenants = this.getTenants(error);

            // Root users never pick a tenant: they log in on root and open tenants through Tenant Manager.
            if (tenants.some(tenant => tenant.id === ROOT_TENANT)) {
                return { type: "switchTenant", tenantId: ROOT_TENANT };
            }

            if (tenants.length === 1) {
                return { type: "switchTenant", tenantId: tenants[0].id };
            }

            if (tenants.length > 1) {
                return { type: "selectTenant", tenants };
            }

            return { type: "noTenantAccess" };
        }

        if (error.code === "Security/Identity/NotAuthorized") {
            return { type: "noTenantAccess" };
        }

        // A stale tenant (from localStorage or `?tenantId`) fails every request. Root always loads,
        // so this retries through root at most once.
        if (UNAVAILABLE_TENANT_CODES.includes(error.code)) {
            if (this.tenantContext.getCurrentTenant() !== ROOT_TENANT) {
                return { type: "switchTenant", tenantId: ROOT_TENANT };
            }
        }

        return { type: "unresolved" };
    }

    private getTenants(error: LogInError): Tenant[] {
        const tenants = error.data.tenants;
        if (!Array.isArray(tenants)) {
            return [];
        }

        return tenants.filter((tenant): tenant is Tenant => !!tenant?.id);
    }
}

export const LoginTenantResolver = Abstraction.createImplementation({
    implementation: LoginTenantResolverImpl,
    dependencies: [TenantContext]
});
