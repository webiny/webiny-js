import { createFeature } from "@webiny/feature/admin";
import { GetFrontendSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetFrontendSettingsUseCase } from "./GetFrontendSettingsUseCase.js";
import { GetFrontendSettingsRepository } from "./GetFrontendSettingsRepository.js";
import { GetFrontendSettingsGateway } from "./GetFrontendSettingsGateway.js";

export const GetFrontendSettingsFeature = createFeature({
    name: "FrontendSettings/Admin/GetSettings",
    register(container) {
        container.register(GetFrontendSettingsUseCase);
        container.register(GetFrontendSettingsRepository).inSingletonScope();
        container.register(GetFrontendSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
