import { createDecorator, Result } from "@webiny/feature/api";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class DeleteEntryRevisionWithFlpDecoratorImpl implements DeleteEntryRevisionUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: DeleteEntryRevisionUseCase.Interface
    ) {}

    async execute(
        model: CmsModel,
        revisionId: string
    ): ReturnType<DeleteEntryRevisionUseCase.Interface["execute"]> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, revisionId);
        }

        const entryResult = await this.getRevisionById.execute(model, revisionId);
        if (entryResult.isFail()) {
            return this.decoratee.execute(model, revisionId);
        }

        const entry = entryResult.value;
        const folderId = entry?.location?.folderId;

        if (!folderId || folderId === ROOT_FOLDER) {
            return this.decoratee.execute(model, revisionId);
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        const canAccessFolder = await this.folderLevelPermissions.canAccessFolderContent({
            permissions,
            rwd: "d"
        });

        if (!canAccessFolder) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return this.decoratee.execute(model, revisionId);
    }
}

export const DeleteEntryRevisionWithFlpDecorator = createDecorator({
    abstraction: DeleteEntryRevisionUseCase,
    decorator: DeleteEntryRevisionWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
