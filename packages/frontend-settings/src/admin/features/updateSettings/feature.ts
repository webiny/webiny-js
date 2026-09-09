import { createFeature } from "@webiny/feature/admin";
import { UpdateFrontendSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateFrontendSettingsUseCase } from "./UpdateFrontendSettingsUseCase.js";
import { UpdateFrontendSettingsRepository } from "./UpdateFrontendSettingsRepository.js";
import { UpdateFrontendSettingsGateway } from "./UpdateFrontendSettingsGateway.js";

export const UpdateFrontendSettingsFeature = createFeature({
    name: "FrontendSettings/Admin/UpdateSettings",
    register(container) {
        container.register(UpdateFrontendSettingsUseCase);
        container.register(UpdateFrontendSettingsRepository).inSingletonScope();
        container.register(UpdateFrontendSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
