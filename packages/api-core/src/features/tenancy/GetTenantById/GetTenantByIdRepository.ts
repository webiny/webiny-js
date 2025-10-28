import { createImplementation } from "@webiny/di-container";
import { GetTenantByIdRepository as RepositoryAbstraction } from "./abstractions.js";
import { GetTenantByIdGateway } from "./abstractions.js";
import { TenantCache } from "../shared/abstractions.js";
import type { Tenant } from "~/types.js";

class GetTenantByIdRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: GetTenantByIdGateway.Interface,
        private cache: TenantCache.Interface
    ) {}

    async getById(id: string): Promise<Tenant | null> {
        const cached = await this.cache.get(id);
        if (cached) {
            return cached;
        }

        const tenant = await this.gateway.getTenantById(id);
        if (tenant) {
            this.cache.prime(id, tenant);
        }
        return tenant;
    }
}

export const GetTenantByIdRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: GetTenantByIdRepositoryImpl,
    dependencies: [GetTenantByIdGateway, TenantCache]
});
