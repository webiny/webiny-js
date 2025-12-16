import { createFeature } from "@webiny/feature/admin";
import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";
import { UpdateFolderUseCase as UseCase } from "./abstractions.js";
import { UpdateFolderUseCase } from "./UpdateFolderUseCase.js";
import { UpdateFolderRepository } from "./UpdateFolderRepository.js";
import { UpdateFolderGqlGateway } from "./UpdateFolderGqlGateway.js";
import { UpdateFolderRepositoryWithPathChange } from "./decorators/RepositoryWithPathChange.js";
import { UpdateFolderRepositoryWithPermissionsChange } from "./decorators/RepositoryWithPermissionsChange.js";
import { UpdateFolderUseCaseWithoutInheritedPermissions } from "./decorators/UseCaseWithoutInheritedPermissions.js";
import { UpdateFolderUseCaseWithLoading } from "./decorators/UseCaseWithLoading.js";

export const UpdateFolderFeature = createFeature({
    name: "UpdateFolder",
    register(container) {
        // Register base use case
        container.register(UpdateFolderUseCase);

        // Register base repository
        container.register(UpdateFolderRepository).inSingletonScope();

        // Register gateway
        container.register(UpdateFolderGqlGateway);

        // Register repository decorators (innermost first)
        container.registerDecorator(UpdateFolderRepositoryWithPathChange);
        container.registerDecorator(UpdateFolderRepositoryWithPermissionsChange);

        // Register use case decorators (innermost first)
        container.registerDecorator(UpdateFolderUseCaseWithoutInheritedPermissions);
        container.registerDecorator(UpdateFolderUseCaseWithLoading);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase),
            loading: container.resolve(FoldersLoadingRepository)
        };
    }
});
