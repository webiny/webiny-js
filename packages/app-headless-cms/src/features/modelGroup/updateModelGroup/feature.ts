import { createFeature } from "@webiny/feature/admin";
import { UpdateModelGroupUseCase as UseCase } from "./abstractions.js";
import { UpdateModelGroupUseCase } from "./UpdateModelGroupUseCase.js";
import { UpdateModelGroupRepository } from "./UpdateModelGroupRepository.js";
import { UpdateModelGroupGateway } from "./UpdateModelGroupGateway.js";

export const UpdateModelGroupFeature = createFeature({
    name: "UpdateModelGroup",
    register(container) {
        container.register(UpdateModelGroupUseCase);
        container.register(UpdateModelGroupRepository).inSingletonScope();
        container.register(UpdateModelGroupGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
