import { createFeature } from "@webiny/feature/admin";
import { UnpublishPageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UnpublishPageUseCase } from "./UnpublishPageUseCase.js";
import { UnpublishPageRepository } from "./UnpublishPageRepository.js";
import { UnpublishPageGateway } from "./UnpublishPageGateway.js";
import { UnpublishPageUseCaseWithLoading } from "./UnpublishPageUseCaseWithLoading.js";

export const UnpublishPageFeature = createFeature({
    name: "WebsiteBuilder/UnpublishPage",
    register(container) {
        container.register(UnpublishPageUseCase);
        container.register(UnpublishPageRepository).inSingletonScope();
        container.register(UnpublishPageGateway).inSingletonScope();
        container.registerDecorator(UnpublishPageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
