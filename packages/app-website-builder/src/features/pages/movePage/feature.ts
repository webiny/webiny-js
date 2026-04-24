import { createFeature } from "@webiny/feature/admin";
import { MovePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { MovePageUseCase } from "./MovePageUseCase.js";
import { MovePageRepository } from "./MovePageRepository.js";
import { MovePageGateway } from "./MovePageGateway.js";
import { MovePageUseCaseWithLoading } from "./MovePageUseCaseWithLoading.js";

export const MovePageFeature = createFeature({
    name: "WebsiteBuilder/MovePage",
    register(container) {
        container.register(MovePageUseCase);
        container.register(MovePageRepository).inSingletonScope();
        container.register(MovePageGateway).inSingletonScope();
        container.registerDecorator(MovePageUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
