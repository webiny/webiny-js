import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import type { FolderBeforeDeleteEvent } from "~/features/folders/DeleteFolder/events.js";
import { ensureFolderIsEmpty } from "~/folder/ensureFolderIsEmpty.js";
import type { AcoContext } from "~/types.js";

export class GenericFolderBeforeDeleteHandler implements FolderBeforeDeleteHandler.Interface {
    constructor(private context: AcoContext) {}

    async handle(event: FolderBeforeDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            await ensureFolderIsEmpty({
                context: this.context,
                folder,
                // We can only check if a folder has child folders.
                // Content is controlled by individual apps, so content checks are implemented there.
                hasContentCallback: () => false
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while ensuring folder is empty before delete.",
                code: "ACO_BEFORE_FOLDER_DELETE_FILE_HANDLER"
            });
        }
    }
}
