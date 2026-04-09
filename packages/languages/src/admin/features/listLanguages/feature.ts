import { createFeature } from "@webiny/feature/admin";
import {
    ListLanguagesUseCase as UseCaseAbstraction,
    ListLanguagesRepository as RepositoryAbstraction
} from "./abstractions.js";
import { ListLanguagesUseCase } from "./ListLanguagesUseCase.js";
import { ListLanguagesRepository } from "./ListLanguagesRepository.js";
import { ListLanguagesGateway } from "./ListLanguagesGateway.js";

export const ListLanguagesFeature = createFeature({
    name: "Languages/ListLanguages",
    register(container) {
        container.register(ListLanguagesUseCase);
        container.register(ListLanguagesRepository).inSingletonScope();
        container.register(ListLanguagesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction),
            repository: container.resolve(RepositoryAbstraction)
        };
    }
});
