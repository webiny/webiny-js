import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { CreateFolderUseCase } from "../abstractions.js";
import type { CreateFolderParams } from "~/folder/folder.types.js";
import { NotAuthorizedError } from "@webiny/api-security";
import { createDecorator } from "@webiny/feature/api";

class CreateFolderWithFolderLevelPermissionsImpl implements CreateFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly decoretee: CreateFolderUseCase.Interface;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        decoretee: CreateFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.decoretee = decoretee;
    }

    async execute(params: CreateFolderParams) {
        let canCreateFolder: boolean;
        if (params.parentId) {
            const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(
                params.parentId
            );
            canCreateFolder = await this.folderLevelPermissions.canAccessFolder({
                permissions,
                rwd: "w"
            });
        } else {
            canCreateFolder = this.folderLevelPermissions.canCreateFolderInRoot();
        }

        if (!canCreateFolder) {
            throw new NotAuthorizedError();
        }

        const folder = await this.decoretee.execute(params);

        // Let's set default permissions based on the current user.
        const permissionsWithDefaults = await this.folderLevelPermissions.getDefaultPermissions(
            folder?.permissions ?? []
        );

        return {
            ...folder,
            permissions: permissionsWithDefaults
        };
    }
}

export const CreateFolderWithFolderLevelPermissions = createDecorator({
    abstraction: CreateFolderUseCase,
    decorator: CreateFolderWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
