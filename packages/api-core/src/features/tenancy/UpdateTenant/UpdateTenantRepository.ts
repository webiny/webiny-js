import { createImplementation } from "@webiny/feature/api";
import { UpdateTenantRepository as RepositoryAbstraction } from "./abstractions.js";
import { UpdateTenantGateway } from "./abstractions.js";
import { TenantCache } from "../shared/abstractions.js";
import type { Tenant } from "~/types.js";

class UpdateTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: UpdateTenantGateway.Interface,
        private cache: TenantCache.Interface
    ) {}

    async update(tenant: Tenant) {
        const updated = await this.gateway.updateTenant(tenant);
        this.cache.clear(updated.id);
        this.cache.prime(updated.id, updated);
        return updated;
    }
}

export const UpdateTenantRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: UpdateTenantRepositoryImpl,
    dependencies: [UpdateTenantGateway, TenantCache]
});
