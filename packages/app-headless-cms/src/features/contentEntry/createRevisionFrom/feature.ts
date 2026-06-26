import { createFeature } from "@webiny/feature/admin";
import { CreateRevisionFromUseCase as UseCase } from "./abstractions.js";
import { CreateRevisionFromUseCase } from "./CreateRevisionFromUseCase.js";
import { CreateRevisionFromRepository } from "./CreateRevisionFromRepository.js";
import { CreateRevisionFromGateway } from "./CreateRevisionFromGateway.js";

export const CreateRevisionFromFeature = createFeature({
    name: "CmsContentEntry/CreateRevisionFrom",
    register(container) {
        container.register(CreateRevisionFromUseCase);
        container.register(CreateRevisionFromRepository).inSingletonScope();
        container.register(CreateRevisionFromGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
