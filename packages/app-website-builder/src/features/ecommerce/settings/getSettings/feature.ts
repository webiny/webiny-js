import { createFeature } from "@webiny/feature/admin";
import { GetEcommerceSettingsUseCase as UseCaseAbstraction } from "./abstractions/index.js";
import { GetEcommerceSettingsUseCase } from "./GetEcommerceSettingsUseCase.js";
import { GetEcommerceSettingsRepository } from "./GetEcommerceSettingsRepository.js";
import { GetEcommerceSettingsGateway } from "./GetEcommerceSettingsGateway.js";

export const GetEcommerceSettingsFeature = createFeature({
    name: "WebsiteBuilder/GetEcommerceSettings",
    register(container) {
        container.register(GetEcommerceSettingsUseCase);
        container.register(GetEcommerceSettingsRepository).inSingletonScope();
        container.register(GetEcommerceSettingsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
