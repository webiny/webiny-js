import { createFeature } from "@webiny/feature/admin";
import { DeletePageRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeletePageRevisionUseCase } from "./DeletePageRevisionUseCase.js";
import { DeletePageRevisionRepository } from "./DeletePageRevisionRepository.js";
import { DeletePageRevisionGateway } from "./DeletePageRevisionGateway.js";
import { DeletePageRevisionUseCaseWithLoading } from "./DeletePageRevisionUseCaseWithLoading.js";

export const DeletePageRevisionFeature = createFeature({
    name: "WebsiteBuilder/DeletePageRevision",
    register(container) {
        container.register(DeletePageRevisionUseCase);
        container.register(DeletePageRevisionRepository).inSingletonScope();
        container.register(DeletePageRevisionGateway).inSingletonScope();
        container.registerDecorator(DeletePageRevisionUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
