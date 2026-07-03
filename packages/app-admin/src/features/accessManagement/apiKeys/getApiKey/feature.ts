import { createFeature } from "@webiny/feature/admin";
import { GetApiKeyUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetApiKeyUseCase } from "./GetApiKeyUseCase.js";
import { GetApiKeyRepository } from "./GetApiKeyRepository.js";
import { GetApiKeyGateway } from "./GetApiKeyGateway.js";

export const GetApiKeyFeature = createFeature({
    name: "AccessManagement/GetApiKey",
    register(container) {
        container.register(GetApiKeyUseCase);
        container.register(GetApiKeyRepository).inSingletonScope();
        container.register(GetApiKeyGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
