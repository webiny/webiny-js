import { createFeature } from "@webiny/feature/admin";
import { UpdatePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdatePageUseCase } from "./UpdatePageUseCase.js";
import { UpdatePageRepository } from "./UpdatePageRepository.js";
import { UpdatePageGateway } from "./UpdatePageGateway.js";
import { UpdatePageUseCaseWithLoading } from "./UpdatePageUseCaseWithLoading.js";

export const UpdatePageFeature = createFeature({
    name: "WebsiteBuilder/UpdatePage",
    register(container) {
        container.register(UpdatePageUseCase);
        container.register(UpdatePageRepository).inSingletonScope();
        container.register(UpdatePageGateway).inSingletonScope();
        container.registerDecorator(UpdatePageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
