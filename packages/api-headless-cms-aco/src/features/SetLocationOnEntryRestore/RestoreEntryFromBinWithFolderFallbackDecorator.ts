import { createDecorator } from "@webiny/feature/api";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";
import { RestoreEntryFromBinRepository } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/index.js";
import type { CmsEntry, CmsEntryValues, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetFolderUseCase } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";

/**
 * Restores the entry to ROOT_FOLDER if its original folder no longer exists.
 *
 * This is a repository decorator (not an event handler), so the fallback also applies
 * to models which do not publish entry lifecycle events.
 */
class RestoreEntryFromBinWithFolderFallbackDecoratorImpl
    implements RestoreEntryFromBinRepository.Interface
{
    constructor(
        private getFolderUseCase: GetFolderUseCase.Interface,
        private decoratee: RestoreEntryFromBinRepository.Interface
    ) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(model: CmsModel, entry: CmsEntry<T>) {
        const folderId = entry.location?.folderId;

        /**
         * Skip further execution if folderId is falsy or equals ROOT_FOLDER.
         */
        if (!folderId || folderId === ROOT_FOLDER) {
            return this.decoratee.execute<T>(model, entry);
        }

        /**
         * Retrieve the folder: if it exists, no additional operations are necessary.
         */
        const result = await this.getFolderUseCase.execute(folderId);
        if (result.isOk()) {
            return this.decoratee.execute<T>(model, entry);
        }

        /**
         * If the folder is not found, set ROOT_FOLDER as the location.
         */
        return this.decoratee.execute<T>(model, {
            ...entry,
            location: {
                ...entry.location,
                folderId: ROOT_FOLDER
            }
        });
    }
}

export const RestoreEntryFromBinWithFolderFallbackDecorator = createDecorator({
    abstraction: RestoreEntryFromBinRepository,
    decorator: RestoreEntryFromBinWithFolderFallbackDecoratorImpl,
    dependencies: [GetFolderUseCase]
});
