import { createFeature } from "@webiny/feature/admin";
import { PublishPageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { PublishPageUseCase } from "./PublishPageUseCase.js";
import { PublishPageRepository } from "./PublishPageRepository.js";
import { PublishPageGateway } from "./PublishPageGateway.js";
import { PublishPageUseCaseWithLoading } from "./PublishPageUseCaseWithLoading.js";

export const PublishPageFeature = createFeature({
    name: "WebsiteBuilder/PublishPage",
    register(container) {
        container.register(PublishPageUseCase);
        container.register(PublishPageRepository).inSingletonScope();
        container.register(PublishPageGateway).inSingletonScope();
        container.registerDecorator(PublishPageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
