import { createFeature } from "@webiny/feature/admin";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "./GetSettingsUseCase.js";
import { GetSettingsRepository } from "./GetSettingsRepository.js";
import { GetSettingsGateway } from "./GetSettingsGateway.js";
import { SaveSettingsGateway } from "./SaveSettingsGateway.js";

export const GetSettingsFeature = createFeature({
    name: "FileManager/GetSettings",
    register(container) {
        container.register(GetSettingsUseCase);
        container.register(GetSettingsRepository).inSingletonScope();
        container.register(GetSettingsGateway).inSingletonScope();
        container.register(SaveSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
