import { createFeature } from "@webiny/feature/admin";
import { DeleteModelGroupUseCase as UseCase } from "./abstractions.js";
import { DeleteModelGroupUseCase } from "./DeleteModelGroupUseCase.js";
import { DeleteModelGroupRepository } from "./DeleteModelGroupRepository.js";
import { DeleteModelGroupGateway } from "./DeleteModelGroupGateway.js";

export const DeleteModelGroupFeature = createFeature({
    name: "DeleteModelGroup",
    register(container) {
        container.register(DeleteModelGroupUseCase);
        container.register(DeleteModelGroupRepository).inSingletonScope();
        container.register(DeleteModelGroupGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
