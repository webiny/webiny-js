import { createFeature } from "@webiny/feature/admin";
import { DeletePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeletePageUseCase } from "./DeletePageUseCase.js";
import { DeletePageRepository } from "./DeletePageRepository.js";
import { DeletePageGateway } from "./DeletePageGateway.js";
import { DeletePageUseCaseWithLoading } from "./DeletePageUseCaseWithLoading.js";

export const DeletePageFeature = createFeature({
    name: "WebsiteBuilder/DeletePage",
    register(container) {
        container.register(DeletePageUseCase);
        container.register(DeletePageRepository).inSingletonScope();
        container.register(DeletePageGateway).inSingletonScope();
        container.registerDecorator(DeletePageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
