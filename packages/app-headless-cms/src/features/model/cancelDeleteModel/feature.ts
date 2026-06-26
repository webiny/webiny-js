import { createFeature } from "@webiny/feature/admin";
import { CancelDeleteModelUseCase as UseCase } from "./abstractions.js";
import { CancelDeleteModelUseCase } from "./CancelDeleteModelUseCase.js";
import { CancelDeleteModelRepository } from "./CancelDeleteModelRepository.js";
import { CancelDeleteModelGateway } from "./CancelDeleteModelGateway.js";

export const CancelDeleteModelFeature = createFeature({
    name: "CmsModel/CancelDeleteModel",
    register(container) {
        container.register(CancelDeleteModelUseCase);
        container.register(CancelDeleteModelRepository).inSingletonScope();
        container.register(CancelDeleteModelGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
