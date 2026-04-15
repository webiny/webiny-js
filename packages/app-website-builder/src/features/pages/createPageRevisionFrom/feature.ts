import { createFeature } from "@webiny/feature/admin";
import { CreatePageRevisionFromUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreatePageRevisionFromUseCase } from "./CreatePageRevisionFromUseCase.js";
import { CreatePageRevisionFromRepository } from "./CreatePageRevisionFromRepository.js";
import { CreatePageRevisionFromGateway } from "./CreatePageRevisionFromGateway.js";
import { CreatePageRevisionFromUseCaseWithLoading } from "./CreatePageRevisionFromUseCaseWithLoading.js";

export const CreatePageRevisionFromFeature = createFeature({
    name: "WebsiteBuilder/CreatePageRevisionFrom",
    register(container) {
        container.register(CreatePageRevisionFromUseCase);
        container.register(CreatePageRevisionFromRepository).inSingletonScope();
        container.register(CreatePageRevisionFromGateway).inSingletonScope();
        container.registerDecorator(CreatePageRevisionFromUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
