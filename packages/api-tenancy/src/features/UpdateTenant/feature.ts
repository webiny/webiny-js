import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { UpdateTenantUseCase } from "./UpdateTenantUseCase.js";
import { UpdateTenantRepository } from "./UpdateTenantRepository.js";
import { UpdateTenantGateway } from "./UpdateTenantGateway.js";

export const UpdateTenantFeature = createFeature({
    name: "UpdateTenant",
    register(container: Container) {
        container.register(UpdateTenantUseCase);
        container.register(UpdateTenantRepository).inSingletonScope();
        container.register(UpdateTenantGateway).inSingletonScope();
    }
});
