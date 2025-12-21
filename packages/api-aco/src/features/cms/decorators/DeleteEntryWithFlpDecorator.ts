import { createDecorator, Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.js";
import { GetLatestRevisionByEntryIdBaseUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.js";
import type { CmsModel, CmsDeleteEntryOptions } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class DeleteEntryWithFlpDecoratorImpl implements DeleteEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getLatestRevisionByEntryId: GetLatestRevisionByEntryIdBaseUseCase.Interface,
        private decoratee: DeleteEntryUseCase.Interface
    ) {}

    async execute(
        model: CmsModel,
        id: string,
        options?: CmsDeleteEntryOptions
    ): ReturnType<DeleteEntryUseCase.Interface["execute"]> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, id, options);
        }

        const entryResult = await this.getLatestRevisionByEntryId.execute(model, { id });
        if (entryResult.isFail()) {
            return this.decoratee.execute(model, id, options);
        }

        const entry = entryResult.value;
        const folderId = entry?.location?.folderId;

        if (!folderId || folderId === ROOT_FOLDER) {
            return this.decoratee.execute(model, id, options);
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
            permissions,
            rwd: "d"
        });

        if (!canAccessFolder) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return this.decoratee.execute(model, id, options);
    }
}

export const DeleteEntryWithFlpDecorator = createDecorator({
    abstraction: DeleteEntryUseCase,
    decorator: DeleteEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetLatestRevisionByEntryIdBaseUseCase]
});
