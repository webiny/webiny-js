import { createDecorator, Result } from "@webiny/feature/api";
import { RestoreEntryFromBinUseCase } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/abstractions.js";
import { GetLatestDeletedRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.js";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { canAccessEntryFolder } from "./canAccessEntryFolder.js";

/**
 * Security: restoring puts the entry back into its original folder, so it requires write
 * access to that folder.
 */
class RestoreEntryFromBinWithFlpDecoratorImpl implements RestoreEntryFromBinUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getDeletedEntry: GetLatestDeletedRevisionByEntryIdUseCase.Interface,
        private decoratee: RestoreEntryFromBinUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): RestoreEntryFromBinUseCase.Return<T> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute<T>(model, id);
        }

        const entryResult = await this.getDeletedEntry.execute<T>(model, { id });
        if (entryResult.isFail()) {
            return this.decoratee.execute<T>(model, id);
        }

        const entry = entryResult.value;
        const folderIds = [entry.binOriginalFolderId, entry.location?.folderId];
        for (const folderId of folderIds) {
            if (!(await canAccessEntryFolder(this.folderLevelPermissions, folderId, "w"))) {
                return Result.fail(new EntryNotAuthorizedError());
            }
        }

        return this.decoratee.execute<T>(model, id);
    }
}

export const RestoreEntryFromBinWithFlpDecorator = createDecorator({
    abstraction: RestoreEntryFromBinUseCase,
    decorator: RestoreEntryFromBinWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetLatestDeletedRevisionByEntryIdUseCase]
});
