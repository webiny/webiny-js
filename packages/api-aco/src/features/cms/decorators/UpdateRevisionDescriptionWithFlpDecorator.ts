import { createDecorator, Result } from "@webiny/feature/api";
import { UpdateRevisionDescriptionUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateRevisionDescription/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { checkRevisionFolderWriteAccess } from "./canAccessEntryFolder.js";

/** Security: changing the revision description requires write access to the entry's folder. */
class UpdateRevisionDescriptionWithFlpDecoratorImpl
    implements UpdateRevisionDescriptionUseCase.Interface
{
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: UpdateRevisionDescriptionUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        revisionDescription: string | undefined
    ): UpdateRevisionDescriptionUseCase.Return<T> {
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

        return this.decoratee.execute<T>(model, id, revisionDescription);
    }
}

export const UpdateRevisionDescriptionWithFlpDecorator = createDecorator({
    abstraction: UpdateRevisionDescriptionUseCase,
    decorator: UpdateRevisionDescriptionWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
