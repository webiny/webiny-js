import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import type { FolderBeforeDeleteEvent } from "~/features/folders/DeleteFolder/events.js";
import { EnsureFolderIsEmpty } from "~/features/folders/EnsureFolderIsEmpty/abstractions.js";

class GenericFolderBeforeDeleteHandlerImpl implements FolderBeforeDeleteHandler.Interface {
    constructor(private ensureFolderIsEmpty: EnsureFolderIsEmpty.Interface) {}

    async handle(event: FolderBeforeDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        const result = await this.ensureFolderIsEmpty.execute(
            folder.type,
            folder.id,
            // We can only check if a folder has child folders.
            // Content is controlled by individual apps, so content checks are implemented there.
            () => false
        );

        if (result.isFail()) {
            throw WebinyError.from(result.error, {
                message: "Error while ensuring folder is empty before delete.",
                code: "ACO_BEFORE_FOLDER_DELETE_FILE_HANDLER"
            });
        }
    }
}

export const GenericFolderBeforeDeleteHandler = FolderBeforeDeleteHandler.createImplementation({
    implementation: GenericFolderBeforeDeleteHandlerImpl,
    dependencies: [EnsureFolderIsEmpty]
});
