import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di-container";
import { CreateFolderUseCase } from "./CreateFolderUseCase.js";
import { CreateFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { EventPublisher } from "@webiny/api-core";
import { CreateFolderWithFolderLevelPermissions } from "./decorators/CreateFolderWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
}

export const CreateFolderFeature = createFeature({
    name: "CreateFolder",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const eventPublisher = container.resolve(EventPublisher);
            const folderLevelPermissions = container.resolve(FolderLevelPermissions);
            const baseUseCase = new CreateFolderUseCase(eventPublisher, deps.storageOperations);

            return new CreateFolderWithFolderLevelPermissions(
                folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
