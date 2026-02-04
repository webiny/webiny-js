import { createFeature } from "@webiny/feature/admin";
import { DisableTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DisableTenantUseCase } from "./DisableTenantUseCase.js";
import { DisableTenantRepository } from "./DisableTenantRepository.js";
import { DisableTenantGateway } from "./DisableTenantGateway.js";

export const DisableTenantFeature = createFeature({
    name: "DisableTenant",
    register(container) {
        container.register(DisableTenantUseCase);
        container.register(DisableTenantRepository).inSingletonScope();
        container.register(DisableTenantGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
