import { createFeature } from "@webiny/feature";
import type { Container } from "@webiny/di-container";
import { GetFolderUseCase } from "./GetFolderUseCase.js";
import { GetFolderUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FolderLevelPermissions } from "~/flp/index.js";
import type { AcoFolderStorageOperations } from "~/types.js";
import { EventPublisher } from "@webiny/api-core";
import { GetFolderWithFolderLevelPermissions } from "./decorators/GetFolderWithFolderLevelPermissions.js";

interface LegacyDeps {
    storageOperations: AcoFolderStorageOperations;
    folderLevelPermissions: FolderLevelPermissions;
}

export const GetFolderFeature = createFeature({
    name: "GetFolder",
    register(container: Container, deps: LegacyDeps) {
        container.registerFactory(UseCaseAbstraction, () => {
            const eventPublisher = container.resolve(EventPublisher);
            const baseUseCase = new GetFolderUseCase(eventPublisher, deps.storageOperations);

            return new GetFolderWithFolderLevelPermissions(
                deps.folderLevelPermissions,
                baseUseCase
            );
        });
    }
});
