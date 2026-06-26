import { createFeature } from "@webiny/feature/admin";
import { UpdateModelUseCase as UseCase } from "./abstractions.js";
import { UpdateModelUseCase } from "./UpdateModelUseCase.js";
import { UpdateModelRepository } from "./UpdateModelRepository.js";
import { UpdateModelGateway } from "./UpdateModelGateway.js";

export const UpdateModelFeature = createFeature({
    name: "CmsModel/UpdateModel",
    register(container) {
        container.register(UpdateModelUseCase);
        container.register(UpdateModelRepository).inSingletonScope();
        container.register(UpdateModelGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
