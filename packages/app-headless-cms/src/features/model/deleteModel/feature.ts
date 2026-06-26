import { createFeature } from "@webiny/feature/admin";
import { DeleteModelUseCase as UseCase } from "./abstractions.js";
import { DeleteModelUseCase } from "./DeleteModelUseCase.js";
import { DeleteModelRepository } from "./DeleteModelRepository.js";
import { DeleteModelGateway } from "./DeleteModelGateway.js";

export const DeleteModelFeature = createFeature({
    name: "CmsModel/DeleteModel",
    register(container) {
        container.register(DeleteModelUseCase);
        container.register(DeleteModelRepository).inSingletonScope();
        container.register(DeleteModelGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
