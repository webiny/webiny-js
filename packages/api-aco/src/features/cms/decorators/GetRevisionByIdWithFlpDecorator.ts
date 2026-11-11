import { createDecorator, Result } from "@webiny/feature/api";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.js";
import type { CmsModel, CmsEntryValues, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";
import { EntryNotAuthorizedError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { canAccessEntryFolder } from "./canAccessEntryFolder.js";

/**
 * Security: a revision in a folder the identity cannot read must not be returned.
 * Most entry use cases (update, publish, revision description, validate...) load the entry
 * through this use case, so this also stops them for unreadable folders.
 */
class GetRevisionByIdWithFlpDecoratorImpl implements GetRevisionByIdUseCase.Interface {
    constructor(
        private folderLevelPermissions: FolderLevelPermissions.Interface,
        private decoratee: GetRevisionByIdUseCase.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, GetRevisionByIdUseCase.Error>> {
        const result = await this.decoratee.execute<T>(model, id);

        if (result.isFail() || !this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return result;
        }

        const folderId = result.value.location?.folderId;
        if (!(await canAccessEntryFolder(this.folderLevelPermissions, folderId, "r"))) {
            return Result.fail(new EntryNotAuthorizedError());
        }

        return result;
    }
}

export const GetRevisionByIdWithFlpDecorator = createDecorator({
    abstraction: GetRevisionByIdUseCase,
    decorator: GetRevisionByIdWithFlpDecoratorImpl,
    dependencies: [FolderLevelPermissions]
});
