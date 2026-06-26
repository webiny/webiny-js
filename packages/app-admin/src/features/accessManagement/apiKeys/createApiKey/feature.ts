import { createFeature } from "@webiny/feature/admin";
import { CreateApiKeyUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateApiKeyUseCase } from "./CreateApiKeyUseCase.js";
import { CreateApiKeyRepository } from "./CreateApiKeyRepository.js";
import { CreateApiKeyGateway } from "./CreateApiKeyGateway.js";

export const CreateApiKeyFeature = createFeature({
    name: "AccessManagement/CreateApiKey",
    register(container) {
        container.register(CreateApiKeyUseCase);
        container.register(CreateApiKeyRepository).inSingletonScope();
        container.register(CreateApiKeyGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
