import { createFeature } from "@webiny/feature/admin";
import { GetPageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetPageUseCase } from "./GetPageUseCase.js";
import { GetPageRepository } from "./GetPageRepository.js";
import { GetPageGateway } from "./GetPageGateway.js";
import { GetPageUseCaseWithLoading } from "./GetPageUseCaseWithLoading.js";

export const GetPageFeature = createFeature({
    name: "WebsiteBuilder/GetPage",
    register(container) {
        container.register(GetPageUseCase);
        container.register(GetPageRepository).inSingletonScope();
        container.register(GetPageGateway).inSingletonScope();
        container.registerDecorator(GetPageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
