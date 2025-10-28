import { createImplementation } from "@webiny/feature/api";
import { DeleteTenantRepository as RepositoryAbstraction } from "./abstractions.js";
import { DeleteTenantGateway } from "./abstractions.js";
import { TenantCache } from "../shared/abstractions.js";

export class DeleteTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DeleteTenantGateway.Interface,
        private cache: TenantCache.Interface
    ) {}

    async getById(id: string) {
        return await this.cache.get(id);
    }

    async delete(id: string): Promise<void> {
        await this.gateway.deleteTenant(id);
        this.cache.clear(id);
        this.cache.prime(id, undefined);
    }
}

export const DeleteTenantRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: DeleteTenantRepositoryImpl,
    dependencies: [DeleteTenantGateway, TenantCache]
});
