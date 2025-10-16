import { GetFolderUseCase } from "../abstractions.js";
import type { GetFolderParams } from "~/folder/folder.types.js";
import { NotAuthorizedError } from "@webiny/api-security";
import { createDecorator } from "@webiny/feature/api";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";

class GetFolderWithFolderLevelPermissionsImpl implements GetFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly decoretee: GetFolderUseCase.Interface;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        decoretee: GetFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.decoretee = decoretee;
    }

    async execute(params: GetFolderParams) {
        const folder = await this.decoretee.execute(params);
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folder.id);

        // Let's check if the current user has read access level.
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolder({
            permissions,
            rwd: "r"
        });

        if (!canAccessFolder) {
            throw new NotAuthorizedError();
        }

        return {
            ...folder,
            permissions
        };
    }
}

export const GetFolderWithFolderLevelPermissions = createDecorator({
    abstraction: GetFolderUseCase,
    decorator: GetFolderWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
