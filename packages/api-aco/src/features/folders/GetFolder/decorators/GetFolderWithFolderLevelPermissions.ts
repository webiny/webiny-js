import { GetFolderUseCase } from "../abstractions.js";
import { Result } from "@webiny/feature/api";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { FolderNotAuthorizedError } from "~/domain/folder/errors.js";

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

    async execute(id: string) {
        const result = await this.decoretee.execute(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const folder = result.value;
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folder.id);

        // Let's check if the current user has read access level.
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolder({
            permissions,
            rwd: "r"
        });

        if (!canAccessFolder) {
            return Result.fail(new FolderNotAuthorizedError());
        }

        return Result.ok({
            ...folder,
            permissions
        });
    }
}

export const GetFolderWithFolderLevelPermissions = GetFolderUseCase.createDecorator({
    decorator: GetFolderWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
