import { createFeature } from "@webiny/feature/admin";
import { UpdateSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateSettingsUseCase } from "./UpdateSettingsUseCase.js";
import { UpdateSettingsRepository } from "./UpdateSettingsRepository.js";
import { UpdateSettingsGateway } from "./UpdateSettingsGateway.js";

export const UpdateSettingsFeature = createFeature({
    name: "AiPowerUps/UpdateSettings",
    register(container) {
        container.register(UpdateSettingsUseCase);
        container.register(UpdateSettingsRepository).inSingletonScope();
        container.register(UpdateSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
