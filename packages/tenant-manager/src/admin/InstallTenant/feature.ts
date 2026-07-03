import { createFeature } from "@webiny/feature/admin";
import { InstallTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { InstallTenantUseCase } from "./InstallTenantUseCase.js";
import { InstallTenantRepository } from "./InstallTenantRepository.js";
import { InstallTenantGateway } from "./InstallTenantGateway.js";

export const InstallTenantFeature = createFeature({
    name: "InstallTenant",
    register(container) {
        container.register(InstallTenantUseCase);
        container.register(InstallTenantRepository).inSingletonScope();
        container.register(InstallTenantGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
