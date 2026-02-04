import { createFeature } from "@webiny/feature/admin";
import { EnableTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EnableTenantUseCase } from "./EnableTenantUseCase.js";
import { EnableTenantRepository } from "./EnableTenantRepository.js";
import { EnableTenantGateway } from "./EnableTenantGateway.js";

export const EnableTenantFeature = createFeature({
    name: "EnableTenant",
    register(container) {
        container.register(EnableTenantUseCase);
        container.register(EnableTenantRepository).inSingletonScope();
        container.register(EnableTenantGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
