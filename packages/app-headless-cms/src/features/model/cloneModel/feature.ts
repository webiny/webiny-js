import { createFeature } from "@webiny/feature/admin";
import { CloneModelUseCase as UseCase } from "./abstractions.js";
import { CloneModelUseCase } from "./CloneModelUseCase.js";
import { CloneModelRepository } from "./CloneModelRepository.js";
import { CloneModelGateway } from "./CloneModelGateway.js";

export const CloneModelFeature = createFeature({
    name: "CmsModel/CloneModel",
    register(container) {
        container.register(CloneModelUseCase);
        container.register(CloneModelRepository).inSingletonScope();
        container.register(CloneModelGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
