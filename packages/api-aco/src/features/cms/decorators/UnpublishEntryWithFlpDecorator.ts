import { createDecorator, Result } from "@webiny/feature/api";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { checkRevisionFolderWriteAccess } from "./canAccessEntryFolder.js";

/** Security: unpublishing requires write access to the entry's folder. */
class UnpublishEntryWithFlpDecoratorImpl implements UnpublishEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: UnpublishEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): UnpublishEntryUseCase.Return<T> {
        if (this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            const error = await checkRevisionFolderWriteAccess(
                this.folderLevelPermissions,
                this.getRevisionById,
                model,
                id
            );
            if (error) {
                return Result.fail(error);
            }
        }

        return this.decoratee.execute<T>(model, id);
    }
}

export const UnpublishEntryWithFlpDecorator = createDecorator({
    abstraction: UnpublishEntryUseCase,
    decorator: UnpublishEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
