import { createDecorator, Result } from "@webiny/feature/api";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class MoveEntryWithFlpDecoratorImpl implements MoveEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: MoveEntryUseCase.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string,
        targetFolderId: string
    ): ReturnType<MoveEntryUseCase.Interface["execute"]> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, id, targetFolderId);
        }

        // First, get the entry to check its current folder
        const entryResult = await this.getRevisionById.execute(model, id);
        if (entryResult.isFail()) {
            return this.decoratee.execute(model, id, targetFolderId);
        }

        const entry = entryResult.value;
        const currentFolderId = entry?.location?.folderId || ROOT_FOLDER;

        // If the entry is in the same folder we are trying to move it to, just continue
        if (currentFolderId === targetFolderId) {
            return this.decoratee.execute(model, id, targetFolderId);
        }

        // If current folder is not ROOT, check for access
        if (currentFolderId !== ROOT_FOLDER) {
            const permissions =
                await this.folderLevelPermissions.getFolderLevelPermissions(currentFolderId);

            const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
                permissions,
                rwd: "w"
            });

            if (!canAccessFolder) {
                return Result.fail(new EntryNotAuthorizedError());
            }
        }

        // If target folder is not ROOT, check for access
        if (targetFolderId !== ROOT_FOLDER) {
            const permissions =
                await this.folderLevelPermissions.getFolderLevelPermissions(targetFolderId);

            const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
                permissions,
                rwd: "w"
            });

            if (!canAccessFolder) {
                return Result.fail(new EntryNotAuthorizedError());
            }
        }

        return this.decoratee.execute(model, id, targetFolderId);
    }
}

export const MoveEntryWithFlpDecorator = createDecorator({
    abstraction: MoveEntryUseCase,
    decorator: MoveEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
