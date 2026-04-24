import { createDecorator, Result } from "@webiny/feature/api";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type {
    CmsEntryValues,
    CmsModel,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class CreateEntryRevisionFromWithFlpDecoratorImpl
    implements CreateEntryRevisionFromUseCase.Interface
{
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: CreateEntryRevisionFromUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        sourceId: string,
        input: CreateCmsEntryInput<T>,
        options?: CreateCmsEntryOptionsInput
    ): CreateEntryRevisionFromUseCase.Return<T> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, sourceId, input, options);
        }

        const entryResult = await this.getRevisionById.execute(model, sourceId);
        if (entryResult.isFail()) {
            return this.decoratee.execute(model, sourceId, input, options);
        }

        const entry = entryResult.value;
        const folderId = entry?.location?.folderId;

        if (!folderId || folderId === ROOT_FOLDER) {
            return this.decoratee.execute(model, sourceId, input, options);
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        const canAccessFolderContent = await this.folderLevelPermissions.canAccessFolderContent({
            permissions,
            rwd: "w"
        });

        if (!canAccessFolderContent) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return this.decoratee.execute(model, sourceId, input, options);
    }
}

export const CreateEntryRevisionFromWithFlpDecorator = createDecorator({
    abstraction: CreateEntryRevisionFromUseCase,
    decorator: CreateEntryRevisionFromWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
