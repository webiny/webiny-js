import { createFeature } from "@webiny/feature/admin";
import { GetModelUseCase as UseCase } from "./abstractions.js";
import { GetModelUseCase } from "./GetModelUseCase.js";
import { GetModelRepository } from "./GetModelRepository.js";
import { GetModelGateway } from "./GetModelGateway.js";

export const GetModelFeature = createFeature({
    name: "CmsModel/GetModel",
    register(container) {
        container.register(GetModelUseCase);
        container.register(GetModelRepository).inSingletonScope();
        container.register(GetModelGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
