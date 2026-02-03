import {
    EnableTenantRepository as RepositoryAbstraction,
    EnableTenantGateway
} from "./abstractions.js";

class EnableTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: EnableTenantGateway.Interface) {}

    async execute(tenantId: string): Promise<void> {
        await this.gateway.enableTenant(tenantId);
    }
}

export const EnableTenantRepository = RepositoryAbstraction.createImplementation({
    implementation: EnableTenantRepositoryImpl,
    dependencies: [EnableTenantGateway]
});
