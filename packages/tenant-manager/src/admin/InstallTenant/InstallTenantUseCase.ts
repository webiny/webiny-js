import {
    InstallTenantUseCase as UseCaseAbstraction,
    InstallTenantRepository
} from "./abstractions.js";

class InstallTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: InstallTenantRepository.Interface) {}

    async execute(tenantId: string): Promise<void> {
        return this.repository.execute(tenantId);
    }
}

export const InstallTenantUseCase = UseCaseAbstraction.createImplementation({
    implementation: InstallTenantUseCaseImpl,
    dependencies: [InstallTenantRepository]
});
