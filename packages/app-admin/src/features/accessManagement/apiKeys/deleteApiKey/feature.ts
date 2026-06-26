import { createFeature } from "@webiny/feature/admin";
import { DeleteApiKeyUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteApiKeyUseCase } from "./DeleteApiKeyUseCase.js";
import { DeleteApiKeyRepository } from "./DeleteApiKeyRepository.js";
import { DeleteApiKeyGateway } from "./DeleteApiKeyGateway.js";

export const DeleteApiKeyFeature = createFeature({
    name: "AccessManagement/DeleteApiKey",
    register(container) {
        container.register(DeleteApiKeyUseCase);
        container.register(DeleteApiKeyRepository).inSingletonScope();
        container.register(DeleteApiKeyGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
