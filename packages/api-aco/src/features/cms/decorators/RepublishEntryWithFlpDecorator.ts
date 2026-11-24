import { createDecorator, Result } from "@webiny/feature/api";
import { RepublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { checkRevisionFolderWriteAccess } from "./canAccessEntryFolder.js";

/** Security: republishing requires write access to the entry's folder. */
class RepublishEntryWithFlpDecoratorImpl implements RepublishEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: RepublishEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): RepublishEntryUseCase.Return<T> {
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

export const RepublishEntryWithFlpDecorator = createDecorator({
    abstraction: RepublishEntryUseCase,
    decorator: RepublishEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
