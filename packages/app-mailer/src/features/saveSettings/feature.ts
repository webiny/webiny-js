import { createFeature } from "@webiny/feature/admin";
import { SaveSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SaveSettingsUseCase } from "./SaveSettingsUseCase.js";
import { SaveSettingsGateway } from "./SaveSettingsGateway.js";

export const SaveSettingsFeature = createFeature({
    name: "Mailer/SaveSettings",
    register(container) {
        container.register(SaveSettingsUseCase);
        container.register(SaveSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
