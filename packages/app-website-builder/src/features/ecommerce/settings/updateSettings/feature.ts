import { createFeature } from "@webiny/feature/admin";
import { UpdateEcommerceSettingsUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { UpdateEcommerceSettingsUseCase } from "./UpdateEcommerceSettingsUseCase.js";
import { UpdateEcommerceSettingsRepository } from "./UpdateEcommerceSettingsRepository.js";
import { UpdateEcommerceSettingsGateway } from "./UpdateEcommerceSettingsGateway.js";

export const UpdateEcommerceSettingsFeature = createFeature({
    name: "WebsiteBuilder/UpdateEcommerceSettings",
    register(container) {
        container.register(UpdateEcommerceSettingsUseCase);
        container.register(UpdateEcommerceSettingsRepository).inSingletonScope();
        container.register(UpdateEcommerceSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
