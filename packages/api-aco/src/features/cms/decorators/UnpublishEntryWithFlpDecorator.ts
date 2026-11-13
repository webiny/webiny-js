import { createDecorator, Result } from "@webiny/feature/api";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/abstractions.js";
import { GetPublishedRevisionByEntryIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/abstractions.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { parseIdentifier } from "@webiny/utils";

/**
 * Unpublishing an entry changes it, so the folder it is in must allow writing.
 */
class UnpublishEntryWithFlpDecoratorImpl implements UnpublishEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getPublishedRevisionByEntryId: GetPublishedRevisionByEntryIdUseCase.Interface,
        private decoratee: UnpublishEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UnpublishEntryUseCase.Error>> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute<T>(model, id);
        }

        const entryResult = await this.getPublishedRevisionByEntryId.execute(
            model,
            parseIdentifier(id).id
        );
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

export const UnpublishEntryWithFlpDecorator = createDecorator({
    abstraction: UnpublishEntryUseCase,
    decorator: UnpublishEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetPublishedRevisionByEntryIdUseCase]
});
