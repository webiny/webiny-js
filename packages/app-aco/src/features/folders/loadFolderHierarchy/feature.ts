import { createFeature } from "@webiny/feature/admin";
import { LoadFolderHierarchyUseCase as UseCase } from "./abstractions.js";
import { LoadFolderHierarchyUseCase } from "./LoadFolderHierarchyUseCase.js";
import { LoadFolderHierarchyRepository } from "./LoadFolderHierarchyRepository.js";
import { LoadFolderHierarchyGqlGateway } from "./LoadFolderHierarchyGqlGateway.js";

export const LoadFolderHierarchyFeature = createFeature({
    name: "LoadFolderHierarchy",
    register(container) {
        container.register(LoadFolderHierarchyUseCase);
        container.register(LoadFolderHierarchyRepository).inSingletonScope();
        container.register(LoadFolderHierarchyGqlGateway);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
