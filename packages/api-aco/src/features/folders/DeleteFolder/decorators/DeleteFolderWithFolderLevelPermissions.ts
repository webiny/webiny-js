import type { FolderLevelPermissions } from "~/flp/index.js";
import type { IDeleteFolderUseCase } from "../abstractions.js";
import type { DeleteFolderParams } from "~/folder/folder.types.js";

export class DeleteFolderWithFolderLevelPermissions implements IDeleteFolderUseCase {
    private folderLevelPermissions: FolderLevelPermissions;
    private readonly decoretee: IDeleteFolderUseCase;

    constructor(folderLevelPermissions: FolderLevelPermissions, decoretee: IDeleteFolderUseCase) {
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
