import type { FolderLevelPermissions } from "~/flp/index.js";
import type { IGetFolderUseCase } from "../abstractions.js";
import type { GetFolderParams } from "~/folder/folder.types.js";
import { NotAuthorizedError } from "@webiny/api-security";

export class GetFolderWithFolderLevelPermissions implements IGetFolderUseCase {
    private folderLevelPermissions: FolderLevelPermissions;
    private readonly decoretee: IGetFolderUseCase;

    constructor(folderLevelPermissions: FolderLevelPermissions, decoretee: IGetFolderUseCase) {
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
