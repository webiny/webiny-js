import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { CreateTenantUseCase } from "./CreateTenantUseCase.js";
import { CreateTenantRepository } from "./CreateTenantRepository.js";
import { CreateTenantGateway } from "./CreateTenantGateway.js";

export const CreateTenantFeature = createFeature({
    name: "CreateTenant",
    register(container: Container) {
        // Register gateway (singleton) - auto-wired with DI (depends on TenancyStorageOperations)
        container.register(CreateTenantGateway).inSingletonScope();

        // Register repository (singleton) - auto-wired with DI
        container.register(CreateTenantRepository).inSingletonScope();

        // Register use case (transient) - auto-wired with DI
        // TODO: Wrap with CreateTenantWithWcpIncrement decorator
        // when it's implemented in @webiny/api-wcp
        container.register(CreateTenantUseCase);
    }
});
