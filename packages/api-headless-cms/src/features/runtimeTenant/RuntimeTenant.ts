import { RuntimeTenant as Abstraction } from "./abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";

class RuntimeTenantImpl implements Abstraction.Interface {
    public constructor(private tenantContext: TenantContext.Interface) {}

    public assign<T extends { tenant: string }>(obj: T): T {
        return structuredClone({ ...obj, tenant: this.tenantContext.getTenant().id });
    }
}

export const RuntimeTenant = Abstraction.createImplementation({
    implementation: RuntimeTenantImpl,
    dependencies: [TenantContext]
});
