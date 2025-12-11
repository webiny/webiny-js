import { createFeature } from "@webiny/feature/admin";
import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";
import { ListFoldersUseCase as UseCase } from "./abstractions.js";
import { ListFoldersUseCase } from "./ListFoldersUseCase.js";
import { ListFoldersRepository } from "./ListFoldersRepository.js";
import { ListFoldersGqlGateway } from "./ListFoldersGqlGateway.js";
import { ListFoldersUseCaseWithLoading } from "./ListFoldersUseCaseWithLoading.js";

export const ListFoldersFeature = createFeature({
    name: "ListFolders",
    register(container) {
        // Register base use case
        container.register(ListFoldersUseCase);

        // Register repository
        container.register(ListFoldersRepository).inSingletonScope();

        // Register gateway
        container.register(ListFoldersGqlGateway);

        // Register decorator
        container.registerDecorator(ListFoldersUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase),
            loading: container.resolve(FoldersLoadingRepository)
        };
    }
});
