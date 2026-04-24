import { createFeature } from "@webiny/feature/admin";
import { GetModelGroupUseCase as UseCase } from "./abstractions.js";
import { GetModelGroupUseCase } from "./GetModelGroupUseCase.js";
import { GetModelGroupRepository } from "./GetModelGroupRepository.js";
import { GetModelGroupGateway } from "./GetModelGroupGateway.js";

export const GetModelGroupFeature = createFeature({
    name: "GetModelGroup",
    register(container) {
        container.register(GetModelGroupUseCase);
        container.register(GetModelGroupRepository).inSingletonScope();
        container.register(GetModelGroupGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
