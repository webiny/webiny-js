import WebinyError from "@webiny/error";
import { AcoContext } from "~/types";

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

            const [files] = await context.fileManager.listFiles({
                where: {
                    location: {
                        folderId: id
                    }
                },
                limit: 1
            });

            if (files.length === 0) {
                return;
            }

            throw new WebinyError(
                "Delete all child folders and files before proceeding.",
                "DELETE_FOLDER_WITH_CHILDREN",
                {
                    folder
                }
            );
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderBeforeDeleteFmHook hook.",
                code: "ACO_BEFORE_FOLDER_DELETE_FILE_HOOK"
            });
        }
    });
};
