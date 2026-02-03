import {
    DisableTenantUseCase as UseCaseAbstraction,
    DisableTenantRepository
} from "./abstractions.js";

class DisableTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DisableTenantRepository.Interface) {}

    async execute(tenantId: string): Promise<void> {
        return this.repository.execute(tenantId);
    }
}

export const DisableTenantUseCase = UseCaseAbstraction.createImplementation({
    implementation: DisableTenantUseCaseImpl,
    dependencies: [DisableTenantRepository]
});
