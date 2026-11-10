import { createFeature } from "@webiny/feature/api";
import { FolderTypeAccess } from "./FolderTypeAccess.js";
import {
    ListFoldersWithTypePermissions,
    GetFolderWithTypePermissions,
    CreateFolderWithTypePermissions,
    UpdateFolderWithTypePermissions,
    DeleteFolderWithTypePermissions
} from "./decorators.js";

export const FolderTypePermissionsFeature = createFeature({
    name: "Aco/FolderTypePermissions",
    register(container) {
        container.register(FolderTypeAccess);
        container.registerDecorator(ListFoldersWithTypePermissions);
        container.registerDecorator(GetFolderWithTypePermissions);
        container.registerDecorator(CreateFolderWithTypePermissions);
        container.registerDecorator(UpdateFolderWithTypePermissions);
        container.registerDecorator(DeleteFolderWithTypePermissions);
    }
});
