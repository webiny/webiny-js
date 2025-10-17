import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { GetTenantByIdUseCase } from "./GetTenantByIdUseCase.js";
import { GetTenantByIdRepository } from "./GetTenantByIdRepository.js";
import { GetTenantByIdGateway } from "./GetTenantByIdGateway.js";

export const GetTenantByIdFeature = createFeature({
    name: "GetTenantById",
    register(container: Container) {
        // Register gateway (singleton) - auto-wired with DI (depends on TenancyStorageOperations)
        container.register(GetTenantByIdGateway).inSingletonScope();

        // Register repository (singleton) - auto-wired with DI
        container.register(GetTenantByIdRepository).inSingletonScope();

        // Register use case (transient) - auto-wired with DI
        container.register(GetTenantByIdUseCase);
    }
});
