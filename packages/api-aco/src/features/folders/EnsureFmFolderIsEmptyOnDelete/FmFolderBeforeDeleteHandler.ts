import { WebinyError } from "@webiny/error";
import { FolderBeforeDeleteHandler } from "~/features/folders/DeleteFolder/abstractions.js";
import type { FolderBeforeDeleteEvent } from "~/features/folders/DeleteFolder/events.js";
import { ensureFolderIsEmpty } from "~/folder/ensureFolderIsEmpty.js";
import type { AcoContext } from "~/types.js";

export class FmFolderBeforeDeleteHandler implements FolderBeforeDeleteHandler.Interface {
    constructor(private context: AcoContext) {}

    async handle(event: FolderBeforeDeleteEvent): Promise<void> {
        const { folder } = event.payload;

        try {
            const { id, type } = folder;

            /**
             * Exit if the folder type is not related to File Manager
             */
            if (type !== "FmFile") {
                return;
            }

            await ensureFolderIsEmpty({
                context: this.context,
                folder,
                hasContentCallback: async () => {
                    const [content] = await this.context.fileManager.listFiles({
                        where: {
                            location: {
                                folderId: id
                            }
                        },
                        limit: 1
                    });

                    return content.length > 0;
                }
            });
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while ensuring folder is empty before delete.",
                code: "ACO_BEFORE_FOLDER_DELETE_FILE_HANDLER"
            });
        }
    }
}
