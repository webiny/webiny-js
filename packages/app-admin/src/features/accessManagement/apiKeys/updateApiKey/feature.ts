import { createFeature } from "@webiny/feature/admin";
import { UpdateApiKeyUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateApiKeyUseCase } from "./UpdateApiKeyUseCase.js";
import { UpdateApiKeyRepository } from "./UpdateApiKeyRepository.js";
import { UpdateApiKeyGateway } from "./UpdateApiKeyGateway.js";

export const UpdateApiKeyFeature = createFeature({
    name: "AccessManagement/UpdateApiKey",
    register(container) {
        container.register(UpdateApiKeyUseCase);
        container.register(UpdateApiKeyRepository).inSingletonScope();
        container.register(UpdateApiKeyGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
