import { createDecorator, Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "~/constants.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

class UpdateEntryWithFlpDecoratorImpl implements UpdateEntryUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private decoratee: UpdateEntryUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput<T>,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UpdateEntryUseCase.Error>> {
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return this.decoratee.execute(model, id, input, options);
        }

        const entryResult = await this.getRevisionById.execute(model, id);
        if (entryResult.isFail()) {
            return this.decoratee.execute(model, id, input, options);
        }

        const entry = entryResult.value;
        const currentFolderId = entry?.location?.folderId || ROOT_FOLDER;

        if (!(await this.canWriteToFolder(currentFolderId))) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        // Updating the location moves the entry: the destination folder must allow it too.
        const targetFolderId = input.wbyAco_location?.folderId;
        if (
            targetFolderId &&
            targetFolderId !== currentFolderId &&
            !(await this.canWriteToFolder(targetFolderId))
        ) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return this.decoratee.execute<T>(model, id, input, options);
    }

    private async canWriteToFolder(folderId: string): Promise<boolean> {
        if (folderId === ROOT_FOLDER) {
            return true;
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "w" });
    }
}

export const UpdateEntryWithFlpDecorator = createDecorator({
    abstraction: UpdateEntryUseCase,
    decorator: UpdateEntryWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions, GetRevisionByIdUseCase]
});
