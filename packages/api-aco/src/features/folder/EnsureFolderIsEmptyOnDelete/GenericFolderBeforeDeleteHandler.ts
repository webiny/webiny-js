import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteEventHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import type { FolderBeforeDeleteEvent } from "~/features/folder/DeleteFolder/events.js";
import { EnsureFolderIsEmpty } from "~/features/folder/EnsureFolderIsEmpty/abstractions.js";

class GenericFolderBeforeDeleteHandlerImpl implements FolderBeforeDeleteEventHandler.Interface {
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

export const GenericFolderBeforeDeleteHandler = FolderBeforeDeleteEventHandler.createImplementation(
    {
        implementation: GenericFolderBeforeDeleteHandlerImpl,
        dependencies: [EnsureFolderIsEmpty]
    }
);
