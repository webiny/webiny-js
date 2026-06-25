import { createFeature } from "@webiny/feature/admin";
import { ListModelsUseCase as UseCase } from "./abstractions.js";
import { ListModelsUseCase } from "./ListModelsUseCase.js";
import { ListModelsRepository } from "./ListModelsRepository.js";
import { ListModelsGateway } from "./ListModelsGateway.js";

export const ListModelsFeature = createFeature({
    name: "CmsModel/ListModels",
    register(container) {
        container.register(ListModelsUseCase);
        container.register(ListModelsRepository).inSingletonScope();
        container.register(ListModelsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
