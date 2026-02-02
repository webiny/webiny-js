import {
    EnableTenantUseCase as UseCaseAbstraction,
    EnableTenantRepository
} from "./abstractions.js";

class EnableTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: EnableTenantRepository.Interface) {}

    async execute(tenantId: string): Promise<void> {
        return this.repository.execute(tenantId);
    }
}

export const EnableTenantUseCase = UseCaseAbstraction.createImplementation({
    implementation: EnableTenantUseCaseImpl,
    dependencies: [EnableTenantRepository]
});
