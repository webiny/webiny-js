import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { WB_PAGE_FOLDER_TYPE } from "~/constants.js";
import { WbPageFolderExistsService as Abstraction } from "./abstractions.js";

/** Compared by code, as the CMS service does: no dependency on one ACO module instance. */
const FOLDER_NOT_FOUND = "Aco/Folder/NotFound";

/**
 * The ACO folder model is private (`authorization: false`): the repository read needs no
 * `withoutAuthorization` and runs no folder-level permissions (D69).
 */
class WbPageFolderExistsServiceImpl implements Abstraction.Interface {
    public constructor(private getFolder: GetFolderRepository.Interface) {}

    public async exists(folderId: string): Promise<boolean> {
        // Folder ids are plain entry ids; the repository would read `<id>#<n>` as a revision.
        if (!folderId || folderId.includes("#")) {
            return false;
        }
        const folder = await this.getFolder.execute(folderId);
        if (folder.isFail()) {
            if (folder.error.code === FOLDER_NOT_FOUND) {
                return false;
            }
            throw folder.error;
        }
        return folder.value.type === WB_PAGE_FOLDER_TYPE;
    }
}

export const WbPageFolderExistsService = Abstraction.createImplementation({
    implementation: WbPageFolderExistsServiceImpl,
    dependencies: [GetFolderRepository]
});
