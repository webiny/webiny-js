import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListFoldersUseCase } from "./ListFoldersUseCase.js";
import { ListFoldersWithFolderLevelPermissions } from "./decorators/ListFoldersWithFolderLevelPermissions.js";

export const ListFoldersFeature = createFeature({
    name: "ListFolders",
    register(container: Container) {
        container.register(ListFoldersUseCase);
        container.registerDecorator(ListFoldersWithFolderLevelPermissions);
    }
});
