import { createFeature } from "@webiny/feature/admin";
import { ListCapabilitiesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListCapabilitiesUseCase } from "./ListCapabilitiesUseCase.js";
import { ListCapabilitiesRepository } from "./ListCapabilitiesRepository.js";
import { ListCapabilitiesGateway } from "./ListCapabilitiesGateway.js";

export const ListCapabilitiesFeature = createFeature({
    name: "AiPowerUps/ListCapabilities",
    register(container) {
        container.register(ListCapabilitiesUseCase);
        container.register(ListCapabilitiesRepository).inSingletonScope();
        container.register(ListCapabilitiesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
