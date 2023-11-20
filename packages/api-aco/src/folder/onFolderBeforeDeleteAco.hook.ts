import WebinyError from "@webiny/error";
import { AcoContext, Folder, IAcoApp } from "~/types";

const throwDeleteError = (folder: Folder) => {
    throw new WebinyError(
        "Delete all child folders and entries before proceeding.",
        "DELETE_FOLDER_WITH_CHILDREN",
        {
            folder
        }
    );
};

export const onFolderBeforeDeleteAcoHook = ({ aco }: AcoContext) => {
    aco.folder.onFolderBeforeDelete.subscribe(async ({ folder }) => {
        try {
            const { id, type } = folder;
            /**
             * First we check for the child folders.
             */
            const [children] = await aco.folder.list({
                where: {
                    type,
                    parentId: id
                },
                limit: 1
            });

            if (children.length > 0) {
                throwDeleteError(folder);
            }

            let app: IAcoApp | undefined = undefined;
            try {
                app = aco.getApp(type);
            } catch {
                return;
            }
            const [records] = await app.search.list({
                where: {
                    type,
                    location: {
                        folderId: id
                    }
                },
                limit: 1
            });
            if (records.length === 0) {
                return;
            }
            throwDeleteError(folder);
        } catch (error) {
            throw WebinyError.from(error, {
                message: "Error while executing onFolderBeforeDeleteAcoHook hook.",
                code: "ACO_BEFORE_FOLDER_DELETE_ACO_HOOK"
            });
        }
    });
};
