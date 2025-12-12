import { createFeature } from "@webiny/feature/admin";
import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";
import { ListFoldersByParentIdsUseCase as UseCase } from "./abstractions.js";
import { ListFoldersByParentIdsUseCase } from "./ListFoldersByParentIdsUseCase.js";
import { ListFoldersByParentIdsRepository } from "./ListFoldersByParentIdsRepository.js";
import { ListFoldersByParentIdsGqlGateway } from "./ListFoldersByParentIdsGqlGateway.js";
import { RepositoryWithLoadedCache } from "./decorators/RepositoryWithLoadedCache.js";
import { UseCaseWithLoading } from "./decorators/UseCaseWithLoading.js";

export const ListFoldersByParentIdsFeature = createFeature({
    name: "ListFoldersByParentIds",
    register(container) {
        // Register base use case
        container.register(ListFoldersByParentIdsUseCase);

        // Register base repository
        container.register(ListFoldersByParentIdsRepository).inSingletonScope();

        // Register gateway
        container.register(ListFoldersByParentIdsGqlGateway);

        // Register repository decorator
        container.registerDecorator(RepositoryWithLoadedCache);

        // Register use case decorator
        container.registerDecorator(UseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase),
            loading: container.resolve(FoldersLoadingRepository)
        };
    }
});
