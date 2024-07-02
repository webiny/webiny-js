import WebinyError from "@webiny/error";
import { AcoContext } from "~/types";
import { ensureFolderIsEmpty } from "~/folder/ensureFolderIsEmpty";

export const onFolderBeforeDeleteFmHook = (context: AcoContext) => {
    context.aco.folder.onFolderBeforeDelete.subscribe(async ({ folder }) => {
        try {
            const { id, type } = folder;

            /**
             * Exit if the folder type is not related to File Manager
             */
            if (type !== "FmFile") {
                return;
            }

            await ensureFolderIsEmpty({
                context,
                folder,
                hasContentCallback: async () => {
                    const content = await context.fileManager.listFiles({
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
                message: "Error while executing onFolderBeforeDeleteFmHook hook.",
                code: "ACO_BEFORE_FOLDER_DELETE_FILE_HOOK"
            });
        }
    });
};
