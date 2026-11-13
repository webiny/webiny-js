import { createDecorator, Result } from "@webiny/feature/api";
import { RepublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

/**
 * Republishing an entry changes it, so the folder it is in must allow writing.
 */
class RepublishEntryWithFlpDecoratorImpl implements RepublishEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: RepublishEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, RepublishEntryUseCase.Error>> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute<T>(model, id);
        }

        const entryResult = await this.getRevisionById.execute(model, id);
        if (entryResult.isFail()) {
            return this.decoratee.execute<T>(model, id);
        }

        const folderId = entryResult.value?.location?.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return this.decoratee.execute<T>(model, id);
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
            permissions,
            rwd: "w"
        });

        if (!canAccessFolder) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return this.decoratee.execute<T>(model, id);
    }
}

export const RepublishEntryWithFlpDecorator = createDecorator({
    abstraction: RepublishEntryUseCase,
    decorator: RepublishEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
