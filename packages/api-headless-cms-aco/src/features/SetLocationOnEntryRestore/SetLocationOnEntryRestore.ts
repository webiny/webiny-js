import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";
import { EntryBeforeRestoreFromBinEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.js";
import { GetFolderUseCase } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";

export class SetLocationOnEntryRestore implements EntryBeforeRestoreFromBinEventHandler.Interface {
    constructor(private getFolderUseCase: GetFolderUseCase.Interface) {}

    async handle(event: EntryBeforeRestoreFromBinEventHandler.Event): Promise<void> {
        const { entry } = event.payload;

        /**
         * Skip further execution if folderId is falsy or equals ROOT_FOLDER.
         */
        if (!entry.location?.folderId || entry.location.folderId === ROOT_FOLDER) {
            return;
        }

        /**
         * Retrieve the folder: if it exists, no additional operations are necessary.
         */
        const result = await this.getFolderUseCase.execute(entry.location.folderId);

        /**
         * If the folder is not found, set ROOT_FOLDER as the location.
         */
        if (result.isFail()) {
            entry.location.folderId = ROOT_FOLDER;
        }
    }
}

export const SetLocationOnEntryRestoreImpl = EntryBeforeRestoreFromBinEventHandler.createImplementation({
    implementation: SetLocationOnEntryRestore,
    dependencies: [GetFolderUseCase]
});
