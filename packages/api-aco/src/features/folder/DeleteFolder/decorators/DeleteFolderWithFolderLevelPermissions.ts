import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { DeleteFolderUseCase } from "../abstractions.js";
import { createDecorator, Result } from "@webiny/feature/api";

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

    async execute(id: string) {
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(id);
        await this.folderLevelPermissions.ensureCanAccessFolder({
            permissions,
            rwd: "d"
        });

        const result = await this.decoretee.execute(id);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok();
    }
}

export const DeleteFolderWithFolderLevelPermissions = createDecorator({
    abstraction: DeleteFolderUseCase,
    decorator: DeleteFolderWithFolderLevelPermissionsImpl,
    dependencies: [FolderLevelPermissions]
});
