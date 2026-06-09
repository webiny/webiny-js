import { Abstraction } from "@webiny/di";

export interface ITenant {
    id: string;
}

export interface ITenantContext {
    get(): ITenant | undefined;
    set(tenant: ITenant): void;
    require(): ITenant;
}

export const TenantContext = new Abstraction<ITenantContext>("TenantContext");

class TenantContextImpl implements ITenantContext {
    private tenant?: ITenant;

    get() {
        return this.tenant;
    }

    set(tenant: ITenant) {
        this.tenant = tenant;
    }

    require() {
        if (!this.tenant) {
            throw new Error("Tenant not set");
        }
        return this.tenant;
    }
}

export const tenantContext = TenantContext.createImplementation({
    implementation: TenantContextImpl,
    dependencies: []
});
