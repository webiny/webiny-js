import { createFeature } from "@webiny/feature/admin";
import { CreatePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreatePageUseCase } from "./CreatePageUseCase.js";
import { CreatePageRepository } from "./CreatePageRepository.js";
import { CreatePageGateway } from "./CreatePageGateway.js";
import { CreatePageUseCaseWithLoading } from "./CreatePageUseCaseWithLoading.js";

export const CreatePageFeature = createFeature({
    name: "WebsiteBuilder/CreatePage",
    register(container) {
        container.register(CreatePageUseCase);
        container.register(CreatePageRepository).inSingletonScope();
        container.register(CreatePageGateway).inSingletonScope();
        container.registerDecorator(CreatePageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
