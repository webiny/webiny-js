import { createFeature } from "@webiny/feature/admin";
import { DuplicatePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DuplicatePageUseCase } from "./DuplicatePageUseCase.js";
import { DuplicatePageRepository } from "./DuplicatePageRepository.js";
import { DuplicatePageGateway } from "./DuplicatePageGateway.js";
import { DuplicatePageUseCaseWithLoading } from "./DuplicatePageUseCaseWithLoading.js";

export const DuplicatePageFeature = createFeature({
    name: "WebsiteBuilder/DuplicatePage",
    register(container) {
        container.register(DuplicatePageUseCase);
        container.register(DuplicatePageRepository).inSingletonScope();
        container.register(DuplicatePageGateway).inSingletonScope();
        container.registerDecorator(DuplicatePageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
