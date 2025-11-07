import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";

export class FilterEntriesByFolderFactory {
    private readonly folderLevelPermissions: FolderLevelPermissions.Interface;

    constructor(folderLevelPermissions: FolderLevelPermissions.Interface) {
        this.folderLevelPermissions = folderLevelPermissions;
    }

    public async execute(entries: CmsEntry[]): Promise<CmsEntry[]> {
        const results = await Promise.all(
            entries.map(async entry => {
                const folderId = entry.location?.folderId;
                if (!folderId || folderId === ROOT_FOLDER) {
                    return entry;
                }

                const permissions =
                    await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
                const canAccessFolderContent =
                    await this.folderLevelPermissions.canAccessFolderContent({
                        permissions,
                        rwd: "r"
                    });
                return canAccessFolderContent ? entry : null;
            })
        );

        return results.filter((entry): entry is CmsEntry => !!entry);
    }
}
