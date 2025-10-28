import { Container } from "@webiny/di-container";
import type { CreateTenantInput, ListTenantsParams, Tenancy, Tenant } from "~/types/tenancy.js";
import { CreateTenantUseCase } from "~/features/tenancy/CreateTenant/abstractions.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/abstractions.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/abstractions.js";
import { ListTenantsUseCase } from "~/features/tenancy/ListTenants/abstractions.js";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";

export class LegacyContext implements Tenancy {
    constructor(private container: Container) {}

    async createTenant(data: CreateTenantInput): Promise<Tenant> {
        const useCase = this.container.resolve(CreateTenantUseCase);
        const result = await useCase.execute(data);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    getCurrentTenant(): Tenant {
        const tenantContext = this.container.resolve(TenantContext);
        return tenantContext.getTenant();
    }

    async getRootTenant(): Promise<Tenant> {
        const useCase = this.container.resolve(GetRootTenantUseCase);
        const result = await useCase.execute();

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async getTenantById(id: string): Promise<Tenant> {
        const useCase = this.container.resolve(GetTenantByIdUseCase);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    async listTenants(params?: ListTenantsParams): Promise<Tenant[]> {
        const useCase = this.container.resolve(ListTenantsUseCase);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    setCurrentTenant(tenant: Tenant): void {
        const tenantContext = this.container.resolve(TenantContext);
        tenantContext.setTenant(tenant);
    }

    async withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        const tenantContext = this.container.resolve(TenantContext);
        return tenantContext.withEachTenant(tenants, cb);
    }

    async withRootTenant<T>(cb: () => T): Promise<T> {
        const tenantContext = this.container.resolve(TenantContext);
        return tenantContext.withRootTenant(cb);
    }

    async withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        const tenantContext = this.container.resolve(TenantContext);
        return tenantContext.withTenant(tenant, cb);
    }
}
