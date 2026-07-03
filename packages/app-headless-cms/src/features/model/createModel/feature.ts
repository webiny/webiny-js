import { createFeature } from "@webiny/feature/admin";
import { CreateModelUseCase as UseCase } from "./abstractions.js";
import { CreateModelUseCase } from "./CreateModelUseCase.js";
import { CreateModelRepository } from "./CreateModelRepository.js";
import { CreateModelGateway } from "./CreateModelGateway.js";

export const CreateModelFeature = createFeature({
    name: "CmsModel/CreateModel",
    register(container) {
        container.register(CreateModelUseCase);
        container.register(CreateModelRepository).inSingletonScope();
        container.register(CreateModelGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
