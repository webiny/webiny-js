import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { DeleteFolderUseCase } from "../abstractions.js";
import type { DeleteFolderParams } from "~/folder/folder.types.js";
import { createDecorator } from "@webiny/feature/api";

class DeleteFolderWithFolderLevelPermissionsImpl implements DeleteFolderUseCase.Interface {
    private folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly decoretee: DeleteFolderUseCase.Interface;

    constructor(
        folderLevelPermissions: FolderLevelPermissions.Interface,
        decoretee: DeleteFolderUseCase.Interface
    ) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.decoretee = decoretee;
    }

    async execute(params: DeleteFolderParams) {
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(params.id);
        await this.folderLevelPermissions.ensureCanAccessFolder({
            permissions,
            rwd: "d"
        });
        await this.decoretee.execute(params);
        return true;
    }
}

export const DeleteFolderWithFolderLevelPermissions = createDecorator({
    abstraction: DeleteFolderUseCase,
    decorator: DeleteFolderWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
