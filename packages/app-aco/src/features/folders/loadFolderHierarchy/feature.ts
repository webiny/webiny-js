import { createFeature } from "@webiny/feature/admin";
import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";
import { LoadFolderHierarchyUseCase as UseCase } from "./abstractions.js";
import { LoadFolderHierarchyUseCase } from "./LoadFolderHierarchyUseCase.js";
import { LoadFolderHierarchyRepository } from "./LoadFolderHierarchyRepository.js";
import { LoadFolderHierarchyGqlGateway } from "./LoadFolderHierarchyGqlGateway.js";
import { LoadFolderHierarchyUseCaseWithLoading } from "./LoadFolderHierarchyUseCaseWithLoading.js";

export const LoadFolderHierarchyFeature = createFeature({
    name: "LoadFolderHierarchy",
    register(container) {
        // Register base use case
        container.register(LoadFolderHierarchyUseCase);

        // Register repository
        container.register(LoadFolderHierarchyRepository).inSingletonScope();

        // Register gateway
        container.register(LoadFolderHierarchyGqlGateway);

        // Register decorator
        container.registerDecorator(LoadFolderHierarchyUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase),
            loading: container.resolve(FoldersLoadingRepository)
        };
    }
});
