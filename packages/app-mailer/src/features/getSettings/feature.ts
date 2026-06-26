import { createFeature } from "@webiny/feature/admin";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "./GetSettingsUseCase.js";
import { GetSettingsRepository } from "./GetSettingsRepository.js";
import { GetSettingsGateway } from "./GetSettingsGateway.js";

export const GetSettingsFeature = createFeature({
    name: "Mailer/GetSettings",
    register(container) {
        container.register(GetSettingsUseCase);
        container.register(GetSettingsRepository).inSingletonScope();
        container.register(GetSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
