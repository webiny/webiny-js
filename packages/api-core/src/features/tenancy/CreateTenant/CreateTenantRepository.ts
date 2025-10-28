import { createImplementation } from "@webiny/di-container";
import { CreateTenantRepository as RepositoryAbstraction } from "./abstractions.js";
import { CreateTenantGateway } from "./abstractions.js";
import { TenantCache } from "../shared/abstractions.js";
import type { Tenant } from "~/types/tenancy.js";

class CreateTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: CreateTenantGateway.Interface,
        private cache: TenantCache.Interface
    ) {}

    async create(tenant: Tenant) {
        const created = await this.gateway.createTenant(tenant);
        this.cache.prime(created.id, created);
        return created;
    }
}

export const CreateTenantRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: CreateTenantRepositoryImpl,
    dependencies: [CreateTenantGateway, TenantCache]
});
