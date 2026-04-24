import {
    DisableTenantRepository as RepositoryAbstraction,
    DisableTenantGateway
} from "./abstractions.js";

class DisableTenantRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: DisableTenantGateway.Interface) {}

    async execute(tenantId: string): Promise<void> {
        await this.gateway.disableTenant(tenantId);
    }
}

export const DisableTenantRepository = RepositoryAbstraction.createImplementation({
    implementation: DisableTenantRepositoryImpl,
    dependencies: [DisableTenantGateway]
});
