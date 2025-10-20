import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { CreateTenantUseCase } from "./CreateTenantUseCase.js";
import { CreateTenantRepository } from "./CreateTenantRepository.js";
import { CreateTenantGateway } from "./CreateTenantGateway.js";
import { CreateTenantWithWcpIncrement } from "./decorators/CreateTenantWithWcpIncrement.js";

export const CreateTenantFeature = createFeature({
    name: "CreateTenant",
    register(container: Container) {
        container.register(CreateTenantUseCase);
        container.register(CreateTenantGateway).inSingletonScope();
        container.register(CreateTenantRepository).inSingletonScope();
        container.registerDecorator(CreateTenantWithWcpIncrement);
    }
});
