import { createFeature } from "@webiny/feature/admin";
import { ListTagsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTagsUseCase } from "./ListTagsUseCase.js";
import { ListTagsRepository } from "./ListTagsRepository.js";
import { ListTagsGateway } from "./ListTagsGateway.js";

export const ListTagsFeature = createFeature({
    name: "FileManager/ListTags",
    register(container) {
        container.register(ListTagsUseCase);
        container.register(ListTagsRepository).inSingletonScope();
        container.register(ListTagsGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
