import { createFeature } from "@webiny/feature/admin";
import { CreateModelGroupUseCase as UseCase } from "./abstractions.js";
import { CreateModelGroupUseCase } from "./CreateModelGroupUseCase.js";
import { CreateModelGroupRepository } from "./CreateModelGroupRepository.js";
import { CreateModelGroupGateway } from "./CreateModelGroupGateway.js";

export const CreateModelGroupFeature = createFeature({
    name: "CreateModelGroup",
    register(container) {
        container.register(CreateModelGroupUseCase);
        container.register(CreateModelGroupRepository).inSingletonScope();
        container.register(CreateModelGroupGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
